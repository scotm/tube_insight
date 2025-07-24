import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generativeModel } from "@/lib/gemini";

const youtube = google.youtube({
	version: "v3",
	auth: process.env.YOUTUBE_API_KEY,
});

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!session) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { videoId } = await req.json();

	if (!videoId) {
		return new NextResponse("Video ID is required", { status: 400 });
	}

	try {
		// 1. Get Video Details from YouTube
		const videoDetailsResponse = await youtube.videos.list({
			id: [videoId],
			part: ["snippet"],
		});

		const video = videoDetailsResponse.data.items?.[0];
		if (!video || !video.snippet) {
			return new NextResponse("Video not found", { status: 404 });
		}

		const { title, description } = video.snippet;

		// 2. Analyze with Gemini
		const prompt = `Analyze the following YouTube video and provide:
    1. A concise summary (around 100-150 words).
    2. The top 3-5 key topics or themes.
    3. An overall sentiment analysis (e.g., Positive, Negative, Neutral, Mixed).

    Video Title: "${title}"
    Video Description: "${description}"
    `;

		const result = await generativeModel.generateContent(prompt);
		const response = await result.response;
		const analysis = response.text();

		return NextResponse.json({ analysis });
	} catch (error) {
		console.error(`Error analyzing video ${videoId}:`, error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
