import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { badRequest, internal, notFound, ok, unauthorized } from "@/lib/api";
import { analysisLimiter } from "@/lib/rateLimit";
import { auth } from "@/lib/auth";
import { generativeModel } from "@/lib/gemini";
import { AnalysisVideoBodySchema } from "@/types/schemas";

const youtube = google.youtube({
	version: "v3",
	auth: process.env.YOUTUBE_API_KEY,
});

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!session) return unauthorized();
	const user = (session as { user?: { email?: string | null } })?.user;
	const key = user?.email ?? "anonymous";
	const lim = analysisLimiter.allow(`video:${key}`);
	if (!lim.allowed) {
		return NextResponse.json(
			{ error: { message: "Rate limit exceeded. Please retry later." } },
			{ status: 429, headers: { "Retry-After": String(lim.retryAfter ?? 60) } },
		);
	}

	let videoId: string;
	try {
		const json = await req.json();
		const parsed = AnalysisVideoBodySchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Invalid request body",
					issues: parsed.error.issues.map((i) => ({
						path: i.path,
						message: i.message,
						code: i.code,
					})),
				},
				{ status: 400 },
			);
		}
		videoId = parsed.data.videoId;
	} catch {
		return badRequest("Invalid JSON body");
	}

	try {
		// 1) Fetch video details to craft a better prompt (optional but helpful)
		const details = await youtube.videos.list({
			id: [videoId],
			part: ["snippet"],
		});
		const video = details.data.items?.[0];
		if (!video || !video.snippet) {
			return notFound("Video not found");
		}

		const { title, description } = video.snippet;

		// 2) Analyze via Gemini
		const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

Video: https://www.youtube.com/watch?v=${videoId}
Title: ${title}
Description: ${description ?? "(no description)"}

Provide:
1) Core thesis (1 sentence)
2) 3-5 key pillars supporting the thesis
3) Hook deconstruction (quote + psychological trigger)
4) Most tweetable moment as a blockquote
5) Audience & purpose
`;

		const result = await generativeModel.generateContent(prompt);
		const analysis = result.response.text();
		return ok({ analysis });
	} catch (err) {
		console.error("Analysis error", err);
		return internal();
	}
}
