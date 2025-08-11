import { type NextRequest, NextResponse } from "next/server";
import { enqueuePlaylist } from "@/lib/analysisQueue";
import { badRequest, ok, toIssues, unauthorized } from "@/lib/api";
import { auth, type SessionWithAccessToken } from "@/lib/auth";
import { analysisLimiter } from "@/lib/rateLimit";
import { AnalysisPlaylistBodySchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
	const session = await auth();
	const realSession = session as SessionWithAccessToken;
	if (!realSession.accessToken) {
		return unauthorized();
	}
	const accessToken = realSession.accessToken;

	// Rate limit per user
	const user = (session as { user?: { email?: string | null } })?.user;
	const key = user?.email ?? "anonymous";
	const lim = analysisLimiter.allow(`playlist:${key}`);
	if (!lim.allowed) {
		return NextResponse.json(
			{ error: { message: "Rate limit exceeded. Please retry later." } },
			{ status: 429, headers: { "Retry-After": String(lim.retryAfter ?? 60) } },
		);
	}

	let playlistId: string;
	try {
		const json = await req.json();
		const parsed = AnalysisPlaylistBodySchema.safeParse(json);
		if (!parsed.success) {
			return badRequest("Invalid request body", toIssues(parsed.error));
		}
		playlistId = parsed.data.playlistId;
	} catch {
		return badRequest("Invalid JSON body");
	}

	const jobId = await enqueuePlaylist(accessToken, playlistId);
	return ok({ jobId }, 202);
}
