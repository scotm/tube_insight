import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";
import {
	badRequest,
	type Issue,
	internal,
	notFound,
	ok,
	toIssues,
	unauthorized,
} from "../api";

jest.mock("next/server", () => ({
	NextResponse: {
		json: jest.fn((body, init) => ({
			json: () => Promise.resolve(body),
			status: init?.status ?? 200,
			headers: new Headers(init?.headers),
		})),
	},
}));

const mockNextResponseJson = NextResponse.json as jest.Mock;

describe("api helpers", () => {
	beforeEach(() => {
		mockNextResponseJson.mockClear();
	});

	describe("toIssues", () => {
		it("should convert ZodIssues to a simplified Issue array", () => {
			const zodIssues: ZodIssue[] = [
				{
					code: "invalid_type",
					expected: "string",
					received: "undefined",
					path: ["name"],
					message: "Required",
				},
				{
					code: "invalid_string",
					validation: "email",
					path: ["email"],
					message: "Invalid email",
				},
			];
			const result = toIssues({ issues: zodIssues });
			expect(result).toEqual([
				{ path: ["name"], message: "Required", code: "invalid_type" },
				{ path: ["email"], message: "Invalid email", code: "invalid_string" },
			]);
		});
	});

	describe("badRequest", () => {
		it("should return a 400 response with a default message", async () => {
			const response = badRequest();
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ error: { message: "Bad Request", issues: undefined } },
				{ status: 400 },
			);
			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.message).toBe("Bad Request");
		});

		it("should return a 400 response with a custom message and issues", async () => {
			const issues: Issue[] = [
				{ path: ["field"], message: "error", code: "custom" },
			];
			const response = badRequest("Custom error", issues);
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ error: { message: "Custom error", issues } },
				{ status: 400 },
			);
			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error.message).toBe("Custom error");
			expect(body.error.issues).toEqual(issues);
		});
	});

	describe("unauthorized", () => {
		it("should return a 401 response with a custom message", async () => {
			const response = unauthorized("Access denied");
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ error: { message: "Access denied" } },
				{ status: 401 },
			);
			expect(response.status).toBe(401);
		});
	});

	describe("notFound", () => {
		it("should return a 404 response with the default message", async () => {
			const response = notFound();
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ error: { message: "Not Found" } },
				{ status: 404 },
			);
			expect(response.status).toBe(404);
		});
	});

	describe("internal", () => {
		it("should return a 500 response with a custom message", async () => {
			const response = internal("Something broke");
			expect(mockNextResponseJson).toHaveBeenCalledWith(
				{ error: { message: "Something broke" } },
				{ status: 500 },
			);
			expect(response.status).toBe(500);
		});
	});

	describe("ok", () => {
		it("should return a 200 response with data by default", async () => {
			const data = { id: 1, name: "test" };
			const response = ok(data);
			expect(mockNextResponseJson).toHaveBeenCalledWith(data, undefined);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual(data);
		});

		it("should return a response with a custom status code", async () => {
			const data = { id: 1 };
			const response = ok(data, 201);
			expect(mockNextResponseJson).toHaveBeenCalledWith(data, { status: 201 });
			expect(response.status).toBe(201);
		});

		it("should return a response with custom headers", async () => {
			const data = { success: true };
			const init = { status: 202, headers: { "X-Custom": "value" } };
			const response = ok(data, init);
			expect(mockNextResponseJson).toHaveBeenCalledWith(data, init);
			expect(response.status).toBe(202);
			expect(response.headers.get("X-Custom")).toBe("value");
		});
	});
});
