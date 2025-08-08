import type { youtube_v3 } from "googleapis";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { badRequest, internal, ok, toIssues, unauthorized } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getVideosForPlaylist } from "@/lib/youtube";
import { YoutubeVideosQuerySchema } from "@/types/schemas";
import type { Thumbnail, Video } from "@/types/youtube";

function toThumbnail(t?: youtube_v3.Schema$Thumbnail): Thumbnail | undefined {
	if (!t || !t.url || !t.width || !t.height) return undefined;
	return { url: t.url, width: t.width, height: t.height };
}

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
		const videos: Video[] = (items ?? []).reduce<Video[]>((acc, it) => {
			const id =
				(it?.snippet?.resourceId?.videoId as string | undefined | null) ??
				(typeof it?.id === "string" ? (it.id as string) : undefined);
			if (!id) return acc;
			acc.push({
				id,
				title: it?.snippet?.title ?? "",
				description: it?.snippet?.description ?? undefined,
				thumbnails: {
					default: toThumbnail(it?.snippet?.thumbnails?.default),
					medium: toThumbnail(it?.snippet?.thumbnails?.medium),
					high: toThumbnail(it?.snippet?.thumbnails?.high),
				},
			});
			return acc;
		}, []);
		return ok<Video[]>(videos);
	} catch (error) {
		console.error(`Error fetching videos for playlist ${playlistId}:`, error);
		return internal();
	}
}
