// import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { auth, type SessionWithAccessToken } from "@/lib/auth";
import { generativeModel } from "@/lib/gemini";
import { getVideosForPlaylist } from "@/lib/youtube";

async function analyzeVideo(_: string, videoId: string) {
	const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

For the video linked below, please provide the following:

1. **The Core Thesis:** In a single, concise sentence, what is the absolute central argument of this video? 
2. **Key Pillars of Argument:** Present the 3-5 main arguments that support the core thesis. 
3. **The Hook Deconstructed:** Quote the hook from the first 30 seconds and explain the psychological trigger it uses (e.g., "Creates an information gap," "Challenges a common belief"). 
4. **Most Tweetable Moment:** Identify the single most powerful, shareable quote from the video and present it as a blockquote.
5. **Audience & Purpose:** Describe the target audience and the primary goal the creator likely had (e.g., "Educate beginners," "Build brand affinity").

Analyze this video: https://www.youtube.com/watch?v=${videoId}`;

	const result = await generativeModel.generateContent(prompt);
	const response = await result.response;
	return response.text();
}

// async function getVideoDetails(accessToken: string, videoId: string) {
//   const oauth2Client = new google.auth.OAuth2();
//   oauth2Client.setCredentials({ access_token: accessToken });

//   const youtube = google.youtube({
//     version: "v3",
//     auth: oauth2Client,
//   });

//   const videoDetailsResponse = await youtube.videos.list({
//     id: [videoId],
//     part: ["snippet"],
//   });

//   const video = videoDetailsResponse.data.items?.[0];
//   if (!video || !video.snippet) {
//     throw new Error("Video not found");
//   }
//   return video.snippet;
// }

export async function POST(req: NextRequest) {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return new NextResponse("Unauthorized", { status: 401 });
	}
	const accessToken = realSession.accessToken;

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
