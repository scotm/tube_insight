import { GET } from "@/app/api/youtube/videos/route";
import { auth } from "@/lib/auth";
import { getVideosForPlaylist } from "@/lib/youtube";

jest.mock("@/lib/auth", () => ({
	auth: jest.fn(),
}));
jest.mock("@/lib/youtube", () => ({
	getVideosForPlaylist: jest.fn(),
}));

describe("GET /api/youtube/videos", () => {
	const mockedAuth = auth as jest.MockedFunction<typeof auth>;
	const mockedGetVideos = getVideosForPlaylist as jest.MockedFunction<
		typeof getVideosForPlaylist
	>;

	beforeEach(() => {
		jest.resetAllMocks();
		mockedAuth.mockResolvedValue({ accessToken: "token" } as any);
	});

	it("returns 400 when playlistId is missing", async () => {
		const req = new Request("http://localhost/api/youtube/videos");
		const res = await GET(req as any);
		expect(res.status).toBe(400);
	});

	it("returns 200 when playlistId is provided", async () => {
		const videos = [{ id: "1" }, { id: "2" }];
		mockedGetVideos.mockResolvedValue(videos as any);
		const req = new Request(
			"http://localhost/api/youtube/videos?playlistId=abc",
		);
		const res = await GET(req as any);
		expect(mockedGetVideos).toHaveBeenCalledWith("token", "abc");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual(videos);
	});
});
