import { generativeModel } from "@/lib/gemini";
import { getVideosForPlaylist } from "@/lib/youtube";

export type JobStatus = "queued" | "running" | "done" | "error";

export type Job = {
	id: string;
	playlistId: string;
	status: JobStatus;
	createdAt: number;
	updatedAt: number;
	total: number;
	completed: number;
	results: Record<string, string>; // videoId -> analysis
	error?: string;
};

type CacheEntry = { analysis: string; expiresAt: number };

const jobs = new Map<string, Job>();
const cache = new Map<string, CacheEntry>();

function uid(): string {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function getCached(videoId: string): string | null {
	const hit = cache.get(videoId);
	if (!hit) return null;
	if (Date.now() > hit.expiresAt) {
		cache.delete(videoId);
		return null;
	}
	return hit.analysis;
}

function setCache(
	videoId: string,
	analysis: string,
	ttlMs = 24 * 60 * 60 * 1000,
) {
	cache.set(videoId, { analysis, expiresAt: Date.now() + ttlMs });
}

export async function enqueuePlaylist(accessToken: string, playlistId: string) {
	const job: Job = {
		id: uid(),
		playlistId,
		status: "queued",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		total: 0,
		completed: 0,
		results: {},
	};
	jobs.set(job.id, job);
	// Fire and forget
	void runJob(job.id, accessToken, playlistId);
	return job.id;
}

async function analyzeVideo(videoId: string): Promise<string> {
	const cached = getCached(videoId);
	if (cached) return cached;

	const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

Analyze this video and provide:
1) Core thesis (1 sentence)
2) 3-5 key pillars supporting the thesis
3) Hook deconstruction (quote + psychological trigger)
4) Most tweetable moment as a blockquote
5) Audience & purpose

Video: https://www.youtube.com/watch?v=${videoId}`;

	const result = await generativeModel.generateContent(prompt);
	const text = result.response.text();
	setCache(videoId, text);
	return text;
}

async function runJob(jobId: string, accessToken: string, playlistId: string) {
	const job = jobs.get(jobId);
	if (!job) return;
	try {
		job.status = "running";
		job.updatedAt = Date.now();

		type Item = {
			snippet?: { resourceId?: { videoId?: string } };
			id?: string;
		};
		const items = (await getVideosForPlaylist(accessToken, playlistId)) ?? [];
		const ids = (items as Item[])
			.map((it) => it?.snippet?.resourceId?.videoId ?? it?.id)
			.filter((x): x is string => typeof x === "string" && x.length > 0);
		job.total = ids.length;
		job.updatedAt = Date.now();

		for (const vid of ids) {
			const analysis = await analyzeVideo(vid);
			job.results[vid] = analysis;
			job.completed += 1;
			job.updatedAt = Date.now();
			// Small delay to be polite
			await new Promise((r) => setTimeout(r, 50));
		}

		job.status = "done";
		job.updatedAt = Date.now();
	} catch (err) {
		const e = err as Error;
		job.status = "error";
		job.error = e?.message ?? "Unknown error";
		job.updatedAt = Date.now();
	}
}
