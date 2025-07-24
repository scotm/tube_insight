import type { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
	auth: jest.fn(),
}));

jest.mock("googleapis", () => ({
	google: {
		youtube: jest.fn(),
	},
}));

jest.mock("@/lib/gemini", () => ({
	generativeModel: {
		generateContent: jest.fn(),
	},
}));

const { auth } = require("@/lib/auth");
const { google } = require("googleapis");
const { generativeModel } = require("@/lib/gemini");

describe("POST /api/analysis", () => {
	beforeEach(() => {
		jest.resetModules();
		(auth as jest.Mock).mockReset();
		(google.youtube as jest.Mock).mockReset();
		(generativeModel.generateContent as jest.Mock).mockReset();
	});

	it("returns 401 if no session", async () => {
		(auth as jest.Mock).mockResolvedValue(null);
		(google.youtube as jest.Mock).mockReturnValue({
			videos: { list: jest.fn() },
		});

		const { POST } = await import("@/app/api/analysis/route");
		const req = { json: jest.fn() } as unknown as NextRequest;

		const res = await POST(req);
		expect(res.status).toBe(401);
		await expect(res.text()).resolves.toBe("Unauthorized");
	});

	it("returns 400 if videoId missing", async () => {
		(auth as jest.Mock).mockResolvedValue({});
		(google.youtube as jest.Mock).mockReturnValue({
			videos: { list: jest.fn() },
		});

		const { POST } = await import("@/app/api/analysis/route");
		const req = {
			json: jest.fn().mockResolvedValue({}),
		} as unknown as NextRequest;

		const res = await POST(req);
		expect(res.status).toBe(400);
		await expect(res.text()).resolves.toBe("Video ID is required");
	});

	it("returns analysis json on success", async () => {
		(auth as jest.Mock).mockResolvedValue({});
		const mockList = jest.fn().mockResolvedValue({
			data: {
				items: [{ snippet: { title: "title", description: "desc" } }],
			},
		});
		(google.youtube as jest.Mock).mockReturnValue({
			videos: { list: mockList },
		});
		(generativeModel.generateContent as jest.Mock).mockResolvedValue({
			response: { text: () => "analysis text" },
		});

		const { POST } = await import("@/app/api/analysis/route");
		const req = {
			json: jest.fn().mockResolvedValue({ videoId: "123" }),
		} as unknown as NextRequest;

		const res = await POST(req);
		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({ analysis: "analysis text" });
	});
});
