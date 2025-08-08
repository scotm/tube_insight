import { and, eq } from "drizzle-orm";
import { db, tables } from "../client";

const { videos, videoAnalyses } = tables;

export type VideoRecord = typeof videos.$inferSelect;
export type VideoAnalysisRecord = typeof videoAnalyses.$inferSelect;

export async function ensureVideoByYoutubeId(input: {
	youtubeId: string;
	title?: string | null;
	channelId?: string | null;
	publishedAt?: number | null; // unix epoch seconds
	ownerId?: string | null;
}): Promise<VideoRecord> {
	const { youtubeId, title, channelId, publishedAt, ownerId } = input;

	const existing = await db.query.videos.findFirst({
		where: (v, { eq }) => eq(v.youtubeId, youtubeId),
	});
	if (existing) return existing;

	const id = crypto.randomUUID();
	await db
		.insert(videos)
		.values({
			id,
			youtubeId,
			title: title ?? null,
			channelId: channelId ?? null,
			publishedAt: publishedAt ?? null,
			ownerId: ownerId ?? null,
		})
		.onConflictDoNothing({ target: videos.youtubeId });

	const created = await db.query.videos.findFirst({
		where: (v, { eq }) => eq(v.youtubeId, youtubeId),
	});
	if (!created) throw new Error("Failed to create or load video row");
	return created;
}

export async function findAnalysis(params: {
	videoId: string;
	model: string;
	promptHash: string;
}): Promise<VideoAnalysisRecord | undefined> {
	const { videoId, model, promptHash } = params;
	const rows = await db
		.select()
		.from(videoAnalyses)
		.where(
			and(
				eq(videoAnalyses.videoId, videoId),
				eq(videoAnalyses.model, model),
				eq(videoAnalyses.promptHash, promptHash),
			),
		)
		.limit(1);
	return rows[0];
}

export async function upsertAnalysis(params: {
	videoId: string;
	model: string;
	promptHash: string;
	promptVersion?: number;
	summary: string;
	insightsJson?: unknown;
	tokensIn?: number | null;
	tokensOut?: number | null;
}): Promise<VideoAnalysisRecord> {
	const {
		videoId,
		model,
		promptHash,
		promptVersion = 1,
		summary,
		insightsJson,
		tokensIn,
		tokensOut,
	} = params;

	await db
		.insert(videoAnalyses)
		.values({
			id: crypto.randomUUID(),
			videoId,
			model,
			promptVersion,
			promptHash,
			summary,
			insightsJson: JSON.stringify(insightsJson ?? {}),
			tokensIn: tokensIn ?? null,
			tokensOut: tokensOut ?? null,
		})
		.onConflictDoNothing({
			target: [
				videoAnalyses.videoId,
				videoAnalyses.model,
				videoAnalyses.promptHash,
			],
		});

	const existing = await findAnalysis({ videoId, model, promptHash });
	if (!existing) throw new Error("Failed to upsert analysis");
	return existing;
}
