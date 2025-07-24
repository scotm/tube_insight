jest.mock("next/server", () => {
	class MockNextResponse {
		status: number;
		private body: string;
		private parsed?: unknown;
		constructor(body: string, init?: { status?: number }) {
			this.body = body;
			this.status = init?.status ?? 200;
		}
		static json(data: unknown) {
			const res = new MockNextResponse(JSON.stringify(data));
			res.parsed = data;
			return res;
		}
		json() {
			return Promise.resolve(this.parsed ?? JSON.parse(this.body));
		}
		text() {
			return Promise.resolve(
				this.parsed ? JSON.stringify(this.parsed) : this.body,
			);
		}
	}
	return { NextResponse: MockNextResponse };
});

const mockAuth = jest.fn();
const mockGetPlaylists = jest.fn();
jest.mock("@/lib/auth", () => ({
	__esModule: true,
	auth: (...args: unknown[]) => mockAuth(...args),
}));
jest.mock("@/lib/youtube", () => ({
	__esModule: true,
	getPlaylists: (...args: unknown[]) => mockGetPlaylists(...args),
}));

let GET: typeof import("@/app/api/youtube/playlists/route").GET;

beforeEach(async () => {
	jest.resetModules();
	jest.clearAllMocks();
	GET = (await import("@/app/api/youtube/playlists/route")).GET;
});

describe("playlists route GET", () => {
	it("returns 401 when not authorized", async () => {
		mockAuth.mockResolvedValue(null);
		const res = await GET();
		expect(res.status).toBe(401);
		await expect(res.text()).resolves.toBe("Unauthorized");
	});

	it("returns playlists when authorized", async () => {
		mockAuth.mockResolvedValue({ accessToken: "token" });
		const playlists = [{ id: "1" }];
		mockGetPlaylists.mockResolvedValue(playlists);
		const res = await GET();
		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual(playlists);
		expect(mockGetPlaylists).toHaveBeenCalledWith("token");
	});
});
