import { NextResponse } from "next/server";
import { auth, type SessionWithAccessToken } from "@/lib/auth";
import { getPlaylists } from "@/lib/youtube";
import { internal, ok, unauthorized } from "@/lib/api";

export async function GET() {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return unauthorized();
	}

	try {
		const items = await getPlaylists(realSession.accessToken);
		const playlists = (items ?? []).map((p: any) => ({
			id: p?.id as string,
			title: p?.snippet?.title ?? "",
			thumbnails: {
				default: p?.snippet?.thumbnails?.default ?? undefined,
				medium: p?.snippet?.thumbnails?.medium ?? undefined,
				high: p?.snippet?.thumbnails?.high ?? undefined,
			},
		}));
		return ok(playlists);
	} catch (error) {
		console.error("Error fetching playlists:", error);
		return internal();
	}
}
