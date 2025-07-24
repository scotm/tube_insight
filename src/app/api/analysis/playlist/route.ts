import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generativeModel } from "@/lib/gemini";
import { getVideosForPlaylist } from "@/lib/youtube";
import { google } from "googleapis";

async function analyzeVideo(accessToken: string, videoId: string) {
	const { title, description } = await getVideoDetails(accessToken, videoId);

	const prompt = `Analyze the following YouTube video and provide:
  1. A concise summary (around 100-150 words).
  2. The top 3-5 key topics or themes.
  3. An overall sentiment analysis (e.g., Positive, Negative, Neutral, Mixed).

  Video Title: "${title}"
  Video Description: "${description}"
  `;

	const result = await generativeModel.generateContent(prompt);
	const response = await result.response;
	return response.text();
}

async function getVideoDetails(accessToken: string, videoId: string) {
	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: accessToken });

	const youtube = google.youtube({
		version: "v3",
		auth: oauth2Client,
	});

	const videoDetailsResponse = await youtube.videos.list({
		id: [videoId],
		part: ["snippet"],
	});

	const video = videoDetailsResponse.data.items?.[0];
	if (!video || !video.snippet) {
		throw new Error("Video not found");
	}
	return video.snippet;
}

export async function POST(req: NextRequest) {
	const session = await auth();
	if (!(session as any)?.accessToken) {
		return new NextResponse("Unauthorized", { status: 401 });
	}
	const accessToken = (session as any).accessToken;

	const { playlistId } = await req.json();

	if (!playlistId) {
		return new NextResponse("Playlist ID is required", { status: 400 });
	}

	try {
		const videos = await getVideosForPlaylist(accessToken, playlistId);
		if (!videos) {
			return new NextResponse("No videos found for this playlist", {
				status: 404,
			});
		}

		const analysisPromises = videos.reduce(
			(acc: Promise<{ videoId: string; analysis: string }>[], video) => {
				if (video.snippet?.resourceId?.videoId) {
					const videoId = video.snippet.resourceId.videoId;
					acc.push(
						analyzeVideo(accessToken, videoId).then((analysis) => ({
							videoId,
							analysis,
						})),
					);
				}
				return acc;
			},
			[],
		);

		const analyses = await Promise.all(analysisPromises);

		const analysisMap = analyses.reduce(
			(acc, { videoId, analysis }) => {
				acc[videoId] = analysis;
				return acc;
			},
			{} as Record<string, string>,
		);

		return NextResponse.json(analysisMap);
	} catch (error) {
		console.error(`Error analyzing playlist ${playlistId}:`, error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
