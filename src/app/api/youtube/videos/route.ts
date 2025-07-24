import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideosForPlaylist } from "@/lib/youtube";

export async function GET(req: NextRequest) {
	const session = await auth();
	if (!(session as any)?.accessToken) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { searchParams } = new URL(req.url);
	const playlistId = searchParams.get("playlistId");

	if (!playlistId) {
		return new NextResponse("Playlist ID is required", { status: 400 });
	}

	try {
		const videos = await getVideosForPlaylist(
			(session as any).accessToken,
			playlistId,
		);
		return NextResponse.json(videos);
	} catch (error) {
		console.error(`Error fetching videos for playlist ${playlistId}:`, error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
