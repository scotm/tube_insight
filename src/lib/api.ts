import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

export type Issue = {
	path: PropertyKey[];
	message: string;
	code: string;
};

export type ApiError = {
	error: {
		message: string;
		issues?: Issue[];
	};
};

export function toIssues(error: { issues: ZodIssue[] }): Issue[] {
	return error.issues.map((i) => ({
		path: i.path,
		message: i.message,
		code: i.code,
	}));
}

export function badRequest(message = "Bad Request", issues?: Issue[]) {
	return NextResponse.json<ApiError>(
		{ error: { message, issues } },
		{ status: 400 },
	);
}

export function unauthorized(message = "Unauthorized") {
	return NextResponse.json<ApiError>({ error: { message } }, { status: 401 });
}

export function notFound(message = "Not Found") {
	return NextResponse.json<ApiError>({ error: { message } }, { status: 404 });
}

export function internal(message = "Internal Server Error") {
	return NextResponse.json<ApiError>({ error: { message } }, { status: 500 });
}

export function ok<T>(data: T, init?: number | ResponseInit) {
	if (typeof init === "number") {
		return NextResponse.json<T>(data, { status: init });
	}
	return NextResponse.json<T>(data, init);
}
