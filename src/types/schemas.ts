import { z } from "zod";

// Analysis
export const AnalysisVideoBodySchema = z.object({
	videoId: z.string().min(5, "videoId must be a string"),
});
export type AnalysisVideoBody = z.infer<typeof AnalysisVideoBodySchema>;

// YouTube queries
export const YoutubeVideosQuerySchema = z.object({
	playlistId: z.string().min(1, "playlistId is required"),
});
export type YoutubeVideosQuery = z.infer<typeof YoutubeVideosQuerySchema>;
