import { type NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { getVideosForPlaylist } from "@/lib/youtube";

interface SessionWithAccessToken extends Session {
	accessToken?: string;
}

export async function GET(req: NextRequest) {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { searchParams } = new URL(req.url);
	const playlistId = searchParams.get("playlistId");

	if (!playlistId) {
		return new NextResponse("Playlist ID is required", { status: 400 });
	}

	try {
		const videos = await getVideosForPlaylist(
			realSession.accessToken,
			playlistId,
		);
		return NextResponse.json(videos);
	} catch (error) {
		console.error(`Error fetching videos for playlist ${playlistId}:`, error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
