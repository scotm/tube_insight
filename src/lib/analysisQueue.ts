import {
	ensureVideoByYoutubeId,
	findAnalysis,
	upsertAnalysis,
} from "@/db/repositories/analysis";
import { generativeModel, modelName } from "@/lib/gemini";
import { sha256Hex } from "@/lib/hash";
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

const jobs = new Map<string, Job>();

function uid(): string {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
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
	// Ensure a video row exists (minimal metadata for batch jobs)
	const videoRow = await ensureVideoByYoutubeId({ youtubeId: videoId });

	// Keep the existing playlist prompt shape but centralize caching in DB
	const prompt = `Act as a world-class strategic analyst using your native YouTube extension. Your analysis should be deep, insightful, and structured for clarity.

Analyze this video and provide:
1) Core thesis (1 sentence)
2) 3-5 key pillars supporting the thesis
3) Hook deconstruction (quote + psychological trigger)
4) Most tweetable moment as a blockquote
5) Audience & purpose

Video: https://www.youtube.com/watch?v=${videoId}`;

	const promptHash = sha256Hex(`${modelName}\n${prompt}`);

	const cached = await findAnalysis({
		videoId: videoRow.id,
		model: modelName,
		promptHash,
	});
	if (cached) return cached.summary;

	const result = await generativeModel.generateContent(prompt);
	const text = result.response.text();

	await upsertAnalysis({
		videoId: videoRow.id,
		model: modelName,
		promptHash,
		summary: text,
		insightsJson: { source: "gemini", path: "playlist" },
	});

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
