CREATE TABLE `transcript_caches` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`lang` text DEFAULT 'en' NOT NULL,
	`source` text NOT NULL,
	`content` text NOT NULL,
	`fetched_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `video_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` integer DEFAULT 1 NOT NULL,
	`prompt_hash` text NOT NULL,
	`summary` text NOT NULL,
	`insights_json` text NOT NULL,
	`tokens_in` integer,
	`tokens_out` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `video_analyses_unique` ON `video_analyses` (`video_id`,`model`,`prompt_hash`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`youtube_id` text NOT NULL,
	`title` text,
	`channel_id` text,
	`duration_sec` integer,
	`published_at` integer,
	`owner_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_youtube_id_unique` ON `videos` (`youtube_id`);