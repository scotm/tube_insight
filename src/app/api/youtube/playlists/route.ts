import type { youtube_v3 } from "googleapis";
import { internal, ok, unauthorized } from "@/lib/api";
import { auth, type SessionWithAccessToken } from "@/lib/auth";
import { getPlaylists } from "@/lib/youtube";
import type { Playlist, Thumbnail } from "@/types/youtube";

function toThumbnail(t?: youtube_v3.Schema$Thumbnail): Thumbnail | undefined {
	if (!t || !t.url || !t.width || !t.height) return undefined;
	return { url: t.url, width: t.width, height: t.height };
}

export async function GET() {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return unauthorized();
	}

	try {
		const items = await getPlaylists(realSession.accessToken);
		const playlists: Playlist[] = (items ?? []).reduce<Playlist[]>((acc, p) => {
			const id = typeof p?.id === "string" ? p.id : undefined;
			if (!id) return acc;
			acc.push({
				id,
				title: p?.snippet?.title ?? "",
				thumbnails: {
					default: toThumbnail(p?.snippet?.thumbnails?.default),
					medium: toThumbnail(p?.snippet?.thumbnails?.medium),
					high: toThumbnail(p?.snippet?.thumbnails?.high),
				},
			});
			return acc;
		}, []);
		return ok<Playlist[]>(playlists);
	} catch (error) {
		console.error("Error fetching playlists:", error);
		return internal();
	}
}
