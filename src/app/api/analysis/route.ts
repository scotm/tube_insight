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

		// 2. Analyze with Gemini
		const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

For the video linked below, please provide the following:

1. **The Core Thesis:** In a single, concise sentence, what is the absolute central argument of this video? 
2. **Key Pillars of Argument:** Present the 3-5 main arguments that support the core thesis. 
3. **The Hook Deconstructed:** Quote the hook from the first 30 seconds and explain the psychological trigger it uses (e.g., "Creates an information gap," "Challenges a common belief"). 
4. **Most Tweetable Moment:** Identify the single most powerful, shareable quote from the video and present it as a blockquote.
5. **Audience & Purpose:** Describe the target audience and the primary goal the creator likely had (e.g., "Educate beginners," "Build brand affinity").

Analyze this video: https://www.youtube.com/watch?v=${videoId}`;

		const result = await generativeModel.generateContent(prompt);
		const response = result.response;
		const analysis = response.text();

		return NextResponse.json({ analysis });
	} catch (error) {
		console.error(`Error analyzing video ${videoId}:`, error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
