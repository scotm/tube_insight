import { google } from "googleapis";

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
	const all: unknown[] = [];
	let pageToken: string | undefined;
	do {
		const response = await youtube.playlists.list({
			mine: true,
			part: ["snippet", "contentDetails"],
			maxResults: 50,
			pageToken,
		});
		if (response.data.items) all.push(...response.data.items);
		pageToken = (response.data as { nextPageToken?: string }).nextPageToken;
		// Optional safety cap
		if (all.length >= 500) break;
	} while (pageToken);
	return all;
}

export async function getVideosForPlaylist(
	accessToken: string,
	playlistId: string,
) {
	const youtube = getYouTubeClient(accessToken);
	const all: unknown[] = [];
	let pageToken: string | undefined;
	do {
		const response = await youtube.playlistItems.list({
			playlistId,
			part: ["snippet"],
			maxResults: 50,
			pageToken,
		});
		if (response.data.items) all.push(...response.data.items);
		pageToken = (response.data as { nextPageToken?: string }).nextPageToken;
		if (all.length >= 1000) break;
	} while (pageToken);
	return all;
}
