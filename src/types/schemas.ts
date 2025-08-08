import { z } from "zod";

// Analysis
export const AnalysisVideoBodySchema = z.object({
	videoId: z.string().min(5, "videoId must be a string"),
});
export type AnalysisVideoBody = z.infer<typeof AnalysisVideoBodySchema>;

export const AnalysisPlaylistBodySchema = z.object({
	playlistId: z.string().min(1, "playlistId is required"),
});
export type AnalysisPlaylistBody = z.infer<typeof AnalysisPlaylistBodySchema>;

// YouTube queries
export const YoutubeVideosQuerySchema = z.object({
	playlistId: z.string().min(1, "playlistId is required"),
});
export type YoutubeVideosQuery = z.infer<typeof YoutubeVideosQuerySchema>;

export const JobIdParamSchema = z.object({
	id: z.string().min(8, "jobId is invalid"),
});
export type JobIdParam = z.infer<typeof JobIdParamSchema>;
