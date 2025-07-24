import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

function getYouTubeClient(accessToken: string) {
	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({ access_token: accessToken });

	return google.youtube({
		version: "v3",
		auth: oauth2Client,
	});
}

export async function getPlaylists(accessToken: string) {
	const youtube = getYouTubeClient(accessToken);
	const response = await youtube.playlists.list({
		mine: true,
		part: ["snippet", "contentDetails"],
		maxResults: 50,
	});
	return response.data.items;
}

export async function getVideosForPlaylist(
	accessToken: string,
	playlistId: string,
) {
	const youtube = getYouTubeClient(accessToken);
	const response = await youtube.playlistItems.list({
		playlistId: playlistId,
		part: ["snippet"],
		maxResults: 50,
	});
	return response.data.items;
}
