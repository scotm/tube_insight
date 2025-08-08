import { z } from "zod";

export const ThumbnailSchema = z.object({
	url: z.string().url(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
});

export const PlaylistSchema = z.object({
	id: z.string(),
	title: z.string(),
	thumbnails: z.object({
		default: ThumbnailSchema.optional(),
		medium: ThumbnailSchema.optional(),
		high: ThumbnailSchema.optional(),
	}),
});
export const PlaylistArraySchema = z.array(PlaylistSchema);
export type Playlist = z.infer<typeof PlaylistSchema>;

export const VideoSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	thumbnails: z.object({
		default: ThumbnailSchema.optional(),
		medium: ThumbnailSchema.optional(),
		high: ThumbnailSchema.optional(),
	}),
});
export const VideoArraySchema = z.array(VideoSchema);
export type Video = z.infer<typeof VideoSchema>;

export type Thumbnail = z.infer<typeof ThumbnailSchema>;
