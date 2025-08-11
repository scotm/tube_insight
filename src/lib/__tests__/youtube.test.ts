import { jest } from "@jest/globals";

import { google } from "googleapis";
import { getPlaylists, getVideosForPlaylist } from "../youtube";

jest.mock("googleapis", () => ({
	google: {
		auth: {
			OAuth2: jest.fn().mockImplementation(() => ({
				setCredentials: jest.fn(),
			})),
		},
		youtube: jest.fn(),
	},
}));

type MockedGoogle = {
	auth: { OAuth2: jest.Mock };
	youtube: jest.Mock;
};
const mockedGoogle = google as unknown as MockedGoogle;
const mockYoutube = mockedGoogle.youtube;
const mockOAuth2 = mockedGoogle.auth.OAuth2;
const mockSetCredentials = jest.fn();

type ApiItem = { id?: string } | Record<string, unknown>;
type ApiResponse = { data: { items: ApiItem[]; nextPageToken?: string } };
type AsyncApiFn = (...args: unknown[]) => Promise<ApiResponse>;

describe("youtube helpers", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockOAuth2.mockImplementation(() => ({
			setCredentials: mockSetCredentials,
		}));
	});

	describe("getPlaylists", () => {
		it("should correctly initialize the youtube client", async () => {
			const mockPlaylistsList = jest.fn() as jest.Mock<AsyncApiFn>;
			mockPlaylistsList.mockResolvedValue({ data: { items: [] } });
			mockYoutube.mockReturnValue({ playlists: { list: mockPlaylistsList } });

			await getPlaylists("test-access-token");

			expect(mockOAuth2).toHaveBeenCalledTimes(1);
			expect(mockSetCredentials).toHaveBeenCalledWith({
				access_token: "test-access-token",
			});
			expect(mockYoutube).toHaveBeenCalledWith({
				version: "v3",
				auth: expect.any(Object),
			});
		});

		it("should fetch and paginate through all playlists", async () => {
			const mockPlaylistsList = jest.fn() as jest.Mock<AsyncApiFn>;
			mockPlaylistsList.mockResolvedValueOnce({
				data: {
					items: [{ id: "pl1" }, { id: "pl2" }],
					nextPageToken: "token-2",
				},
			});
			mockPlaylistsList.mockResolvedValueOnce({
				data: {
					items: [{ id: "pl3" }],
					nextPageToken: undefined, // Last page
				},
			});

			mockYoutube.mockReturnValue({ playlists: { list: mockPlaylistsList } });

			const playlists = await getPlaylists("test-token");

			expect(playlists).toEqual([{ id: "pl1" }, { id: "pl2" }, { id: "pl3" }]);
			expect(mockPlaylistsList).toHaveBeenCalledTimes(2);
			expect(mockPlaylistsList).toHaveBeenCalledWith(
				expect.objectContaining({ pageToken: undefined }),
			);
			expect(mockPlaylistsList).toHaveBeenCalledWith(
				expect.objectContaining({ pageToken: "token-2" }),
			);
		});

		it("should stop fetching after the safety cap is reached", async () => {
			const mockPlaylistsList = jest.fn() as jest.Mock<AsyncApiFn>;
			mockPlaylistsList.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: Array(50).fill({}),
						nextPageToken: "more-please",
					},
				}),
			);
			mockYoutube.mockReturnValue({ playlists: { list: mockPlaylistsList } });

			const playlists = await getPlaylists("test-token");

			// 10 pages * 50 items/page = 500 items
			expect(playlists.length).toBe(500);
			expect(mockPlaylistsList).toHaveBeenCalledTimes(10);
		});
	});

	describe("getVideosForPlaylist", () => {
		it("should fetch and paginate through all videos in a playlist", async () => {
			const mockPlaylistItemsList = jest.fn() as jest.Mock<AsyncApiFn>;
			mockPlaylistItemsList.mockResolvedValueOnce({
				data: {
					items: [{ id: "vid1" }],
					nextPageToken: "token-2",
				},
			});
			mockPlaylistItemsList.mockResolvedValueOnce({
				data: {
					items: [{ id: "vid2" }],
				},
			});
			mockYoutube.mockReturnValue({
				playlistItems: { list: mockPlaylistItemsList },
			});

			const videos = await getVideosForPlaylist("test-token", "playlist-123");

			expect(videos).toEqual([{ id: "vid1" }, { id: "vid2" }]);
			expect(mockPlaylistItemsList).toHaveBeenCalledTimes(2);
			expect(mockPlaylistItemsList).toHaveBeenCalledWith(
				expect.objectContaining({ playlistId: "playlist-123" }),
			);
		});

		it("should stop fetching videos after the safety cap is reached", async () => {
			const mockPlaylistItemsList = jest.fn() as jest.Mock<AsyncApiFn>;
			mockPlaylistItemsList.mockImplementation(() =>
				Promise.resolve({
					data: {
						items: Array(50).fill({}),
						nextPageToken: "more-videos",
					},
				}),
			);
			mockYoutube.mockReturnValue({
				playlistItems: { list: mockPlaylistItemsList },
			});

			const videos = await getVideosForPlaylist("test-token", "playlist-123");

			// 20 pages * 50 items/page = 1000 items
			expect(videos.length).toBe(1000);
			expect(mockPlaylistItemsList).toHaveBeenCalledTimes(20);
		});
	});
});
