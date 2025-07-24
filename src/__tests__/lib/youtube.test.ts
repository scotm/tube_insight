jest.mock("googleapis", () => {
	const mockPlaylistsList = jest.fn();
	const mockPlaylistItemsList = jest.fn();
	return {
		google: {
			auth: {
				OAuth2: jest.fn().mockImplementation(() => ({
					setCredentials: jest.fn(),
				})),
			},
			youtube: jest.fn().mockImplementation(() => ({
				playlists: { list: mockPlaylistsList },
				playlistItems: { list: mockPlaylistItemsList },
			})),
		},
		__mockPlaylistsList: mockPlaylistsList,
		__mockPlaylistItemsList: mockPlaylistItemsList,
	};
});

jest.mock("google-auth-library", () => ({ OAuth2Client: jest.fn() }));

import { getPlaylists, getVideosForPlaylist } from "@/lib/youtube";
import { google } from "googleapis";

const {
	__mockPlaylistsList: mockPlaylistsList,
	__mockPlaylistItemsList: mockPlaylistItemsList,
} = google as unknown as {
	__mockPlaylistsList: jest.Mock;
	__mockPlaylistItemsList: jest.Mock;
};

describe("youtube library", () => {
	beforeEach(() => {
		mockPlaylistsList.mockReset();
		mockPlaylistItemsList.mockReset();
	});

	describe("getPlaylists", () => {
		it("returns playlist items", async () => {
			const items = [{ id: "1" }];
			mockPlaylistsList.mockResolvedValue({ data: { items } });

			await expect(getPlaylists("token")).resolves.toEqual(items);
			expect(mockPlaylistsList).toHaveBeenCalledWith({
				mine: true,
				part: ["snippet", "contentDetails"],
				maxResults: 50,
			});
		});

		it("throws on API error", async () => {
			mockPlaylistsList.mockRejectedValue(new Error("fail"));

			await expect(getPlaylists("token")).rejects.toThrow("fail");
		});
	});

	describe("getVideosForPlaylist", () => {
		it("returns playlist videos", async () => {
			const items = [{ id: "v1" }];
			mockPlaylistItemsList.mockResolvedValue({ data: { items } });

			await expect(getVideosForPlaylist("token", "pl")).resolves.toEqual(items);
			expect(mockPlaylistItemsList).toHaveBeenCalledWith({
				playlistId: "pl",
				part: ["snippet"],
				maxResults: 50,
			});
		});

		it("throws on API error", async () => {
			mockPlaylistItemsList.mockRejectedValue(new Error("oops"));

			await expect(getVideosForPlaylist("token", "pl")).rejects.toThrow("oops");
		});
	});
});
