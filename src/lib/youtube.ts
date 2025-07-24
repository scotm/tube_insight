import { google } from "googleapis";

const youtube = google.youtube({
	version: "v3",
	auth: process.env.YOUTUBE_API_KEY,
});

export async function getPlaylists() {
	const response = await youtube.playlists.list({
		mine: true,
		part: ["snippet", "contentDetails"],
		maxResults: 50,
	});
	return response.data.items;
}

export async function getVideosForPlaylist(playlistId: string) {
	const response = await youtube.playlistItems.list({
		playlistId: playlistId,
		part: ["snippet"],
		maxResults: 50,
	});
	return response.data.items;
}
