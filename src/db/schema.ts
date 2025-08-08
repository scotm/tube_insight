import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const videos = sqliteTable("videos", {
	id: text("id").primaryKey(),
	youtubeId: text("youtube_id").notNull().unique(),
	title: text("title"),
	channelId: text("channel_id"),
	durationSec: integer("duration_sec"),
	// store as unix epoch seconds for SQLite simplicity
	publishedAt: integer("published_at"),
	ownerId: text("owner_id"),
});

export const videoAnalyses = sqliteTable(
	"video_analyses",
	{
		id: text("id").primaryKey(),
		videoId: text("video_id")
			.notNull()
			.references(() => videos.id, { onDelete: "cascade" }),
		model: text("model").notNull(),
		promptVersion: integer("prompt_version").notNull().default(1),
		promptHash: text("prompt_hash").notNull(),
		summary: text("summary").notNull(),
		// JSON string for portability across SQLite/Postgres
		insightsJson: text("insights_json").notNull(),
		tokensIn: integer("tokens_in"),
		tokensOut: integer("tokens_out"),
		createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
	},
	(t) => ({
		// idempotency: one analysis per (video, model, prompt)
		uniq: uniqueIndex("video_analyses_unique").on(
			t.videoId,
			t.model,
			t.promptHash,
		),
	}),
);

export const transcriptCaches = sqliteTable("transcript_caches", {
	id: text("id").primaryKey(),
	videoId: text("video_id")
		.notNull()
		.references(() => videos.id, { onDelete: "cascade" }),
	lang: text("lang").notNull().default("en"),
	source: text("source").notNull(),
	content: text("content").notNull(),
	fetchedAt: integer("fetched_at").notNull().default(sql`(unixepoch())`),
});
