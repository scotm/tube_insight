import { google } from "googleapis";
import type { NextRequest } from "next/server";
import {
	badRequest,
	internal,
	notFound,
	ok,
	toIssues,
	unauthorized,
} from "@/lib/api";
import { auth } from "@/lib/auth";
import { generativeModel, modelName } from "@/lib/gemini";
import { AnalysisVideoBodySchema } from "@/types/schemas";
import { analysisLimiter } from "@/lib/rateLimit";
import { sha256Hex } from "@/lib/hash";
import {
	ensureVideoByYoutubeId,
	findAnalysis,
	upsertAnalysis,
} from "@/db/repositories/analysis";

const youtube = google.youtube({
	version: "v3",
	auth: process.env.YOUTUBE_API_KEY,
});

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!session) {
		return unauthorized();
	}

	const user = (session as { user?: { email?: string | null } })?.user;
	const key = user?.email ?? "anonymous";
	const lim = analysisLimiter.allow(`legacy:${key}`);
	if (!lim.allowed) {
		return new Response(
			JSON.stringify({
				error: { message: "Rate limit exceeded. Please retry later." },
			}),
			{
				status: 429,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(lim.retryAfter ?? 60),
				},
			},
		);
	}

	let videoId: string;
	try {
		const json = await req.json();
		const parsed = AnalysisVideoBodySchema.safeParse(json);
		if (!parsed.success) {
			return badRequest("Invalid request body", toIssues(parsed.error));
		}
		videoId = parsed.data.videoId;
	} catch {
		return badRequest("Invalid JSON body");
	}

	try {
		// 1. Get Video Details from YouTube
		const videoDetailsResponse = await youtube.videos.list({
			id: [videoId],
			part: ["snippet"],
		});

		const video = videoDetailsResponse.data.items?.[0];
		if (!video || !video.snippet) {
			return notFound("Video not found");
		}

		// 2. Ensure video exists in DB
		const snippet = video.snippet;
		const publishedAt = snippet.publishedAt
			? Math.floor(new Date(snippet.publishedAt).getTime() / 1000)
			: null;
		const videoRow = await ensureVideoByYoutubeId({
			youtubeId: videoId,
			title: snippet.title ?? null,
			channelId: snippet.channelId ?? null,
			publishedAt,
			ownerId: user?.email ?? null,
		});

		// 3. Prepare prompt and check cache
		const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

For the video linked below, please provide the following:

1. **The Core Thesis:** In a single, concise sentence, what is the absolute central argument of this video? 
2. **Key Pillars of Argument:** Present the 3-5 main arguments that support the core thesis. 
3. **The Hook Deconstructed:** Quote the hook from the first 30 seconds and explain the psychological trigger it uses (e.g., "Creates an information gap," "Challenges a common belief"). 
4. **Most Tweetable Moment:** Identify the single most powerful, shareable quote from the video and present it as a blockquote.
5. **Audience & Purpose:** Describe the target audience and the primary goal the creator likely had (e.g., "Educate beginners," "Build brand affinity").

Analyze this video: https://www.youtube.com/watch?v=${videoId}`;

		const promptHash = sha256Hex(`${modelName}\n${prompt}`);
		const cached = await findAnalysis({
			videoId: videoRow.id,
			model: modelName,
			promptHash,
		});
		if (cached) {
			return ok({ analysis: cached.summary });
		}

		// 4. Analyze with Gemini and persist
		const result = await generativeModel.generateContent(prompt);
		const response = result.response;
		const analysis = response.text();

		await upsertAnalysis({
			videoId: videoRow.id,
			model: modelName,
			promptHash,
			summary: analysis,
			insightsJson: { source: "gemini", version: 1 },
		});

		return ok({ analysis });
	} catch (error) {
		console.error(`Error analyzing video ${videoId}:`, error);
		return internal();
	}
}
