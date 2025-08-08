import { type NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { getVideosForPlaylist } from "@/lib/youtube";
import { YoutubeVideosQuerySchema } from "@/types/schemas";
import { badRequest, internal, ok, toIssues, unauthorized } from "@/lib/api";

interface SessionWithAccessToken extends Session {
	accessToken?: string;
}

export async function GET(req: NextRequest) {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return unauthorized();
	}

	const { searchParams } = new URL(req.url);
	const parsed = YoutubeVideosQuerySchema.safeParse({
		playlistId: searchParams.get("playlistId") ?? undefined,
	});
	if (!parsed.success) {
		return badRequest("Invalid query params", toIssues(parsed.error));
	}
	const { playlistId } = parsed.data;

	try {
		const items = await getVideosForPlaylist(
			realSession.accessToken,
			playlistId,
		);
		const videos = (items ?? []).map((it: any) => ({
			id: it?.snippet?.resourceId?.videoId ?? it?.id,
			title: it?.snippet?.title ?? "",
			description: it?.snippet?.description ?? undefined,
			thumbnails: {
				default: it?.snippet?.thumbnails?.default ?? undefined,
				medium: it?.snippet?.thumbnails?.medium ?? undefined,
				high: it?.snippet?.thumbnails?.high ?? undefined,
			},
		}));
		return ok(videos);
	} catch (error) {
		console.error(`Error fetching videos for playlist ${playlistId}:`, error);
		return internal();
	}
}
