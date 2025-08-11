"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { type Video, VideoArraySchema } from "@/types/youtube";

export default function PlaylistDetailPage() {
	const { data: session } = useSession();
	const params = useParams<{ id: string }>();
	const playlistId = params?.id;

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
	const [analysisResult, setAnalysisResult] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const { show } = useToast();

	const {
		data: videos = [],
		isLoading,
		error,
	} = useQuery<Video[]>({
		queryKey: ["playlistVideos", playlistId],
		queryFn: async () => {
			const res = await fetch(`/api/youtube/videos?playlistId=${playlistId}`);
			if (!res.ok) throw new Error(`Failed to load videos (${res.status})`);
			const data = await res.json();
			const parsed = VideoArraySchema.safeParse(data);
			if (!parsed.success) throw new Error("Unexpected videos response shape");
			return parsed.data;
		},
		enabled: !!session && !!playlistId,
	});

	const analyzeMutation = useMutation({
		mutationFn: async (videoId: string) => {
			setAnalysisResult(null);
			const res = await fetch("/api/analysis/video", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ videoId }),
			});
			if (!res.ok) {
				if (res.status === 429) {
					const retry = res.headers.get("Retry-After");
					show({
						title: "Rate limit exceeded",
						description: retry
							? `Try again in ~${retry}s`
							: "Please try again shortly.",
						variant: "warning",
					});
				}
				throw new Error(`Analysis failed (${res.status})`);
			}
			const json = (await res.json()) as { analysis: string };
			return json.analysis;
		},
		onSuccess: (text) => setAnalysisResult(text),
		onError: (err: unknown) => {
			show({
				title: "Analyze failed",
				description: String(err),
				variant: "destructive",
			});
		},
	});

	const startPlaylistAnalysis = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/analysis/playlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ playlistId }),
			});
			if (!res.ok) {
				if (res.status === 429) {
					const retry = res.headers.get("Retry-After");
					show({
						title: "Rate limit exceeded",
						description: retry
							? `Try again in ~${retry}s`
							: "Please try again shortly.",
						variant: "warning",
					});
				}
				throw new Error(`Failed to start analysis (${res.status})`);
			}
			const json = (await res.json()) as { jobId: string };
			return json.jobId;
		},
		onSuccess: (id) => {
			setJobId(id);
			show({ title: "Started playlist analysis", variant: "success" });
		},
		onError: (err: unknown) => {
			show({
				title: "Failed to start analysis",
				description: String(err),
				variant: "destructive",
			});
		},
	});

	type JobData = {
		id: string;
		status: "queued" | "running" | "done" | "error";
		total: number;
		completed: number;
		results: Record<string, string>;
		error: string | null;
	};

	const { data: jobStatus } = useQuery<JobData>({
		queryKey: ["analysisJob", jobId],
		enabled: !!jobId,
		queryFn: async (): Promise<JobData> => {
			const res = await fetch(`/api/analysis/status/${jobId}`);
			if (!res.ok) throw new Error(`Failed to load job status (${res.status})`);
			return (await res.json()) as JobData;
		},
		refetchInterval: (q) => {
			if (!jobId) return false;
			const data = q.state.data as JobData | undefined;
			if (!data) return 1000;
			return data.status === "done" || data.status === "error" ? false : 1500;
		},
	});

	useEffect(() => {
		if (jobStatus?.status !== "done" || videos.length === 0) return;
		const firstId = videos[0].id;
		const txt = jobStatus.results[firstId];
		if (txt) {
			setSelectedVideoId(firstId);
			setAnalysisResult(txt);
		}
	}, [jobStatus, videos]);

	if (!session)
		return <div className="p-4">Please sign in to view this playlist.</div>;
	if (isLoading) return <div className="p-4">Loading videos…</div>;
	if (error instanceof Error)
		return <div className="p-4 text-red-500">Error: {error.message}</div>;

	const filtered = videos.filter((v) =>
		v.title.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="container mx-auto p-4 space-y-6">
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<h1 className="text-2xl font-bold">Playlist Videos</h1>
				<Input
					placeholder="Search videos…"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			<div className="flex gap-3 items-center">
				<Button
					onClick={() => startPlaylistAnalysis.mutate()}
					disabled={startPlaylistAnalysis.isPending || !!jobId}
				>
					{startPlaylistAnalysis.isPending
						? "Starting…"
						: jobId
							? "Running…"
							: "Analyze Playlist"}
				</Button>
				{jobStatus && (
					<div className="text-sm text-muted-foreground">
						Status: {jobStatus.status} ({jobStatus.completed}/{jobStatus.total})
					</div>
				)}
			</div>

			{filtered.length === 0 ? (
				<p>No videos found.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filtered.map((v) => {
						const thumb =
							v.thumbnails.high || v.thumbnails.medium || v.thumbnails.default;
						const vid = v.id;
						return (
							<div key={vid} className="border rounded-lg p-4 space-y-3">
								{thumb ? (
									<Image
										src={thumb.url}
										alt={v.title}
										width={thumb.width}
										height={thumb.height}
										className="w-full h-44 object-cover rounded"
									/>
								) : (
									<div className="w-full h-44 bg-secondary rounded" />
								)}
								<h2 className="font-semibold line-clamp-2" title={v.title}>
									{v.title}
								</h2>
								<div className="flex gap-2">
									<Button
										disabled={analyzeMutation.isPending}
										onClick={() => {
											setSelectedVideoId(vid);
											analyzeMutation.mutate(vid);
										}}
									>
										{analyzeMutation.isPending && selectedVideoId === vid
											? "Analyzing…"
											: "Analyze"}
									</Button>
									<a
										className="underline text-sm self-center"
										href={`https://www.youtube.com/watch?v=${vid}`}
										target="_blank"
										rel="noreferrer"
									>
										Open on YouTube
									</a>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{selectedVideoId && (
				<div className="border rounded-lg p-4">
					<h3 className="font-semibold mb-2">Analysis</h3>
					{analyzeMutation.isPending && <p>Analyzing video…</p>}
					{analyzeMutation.isError && (
						<p className="text-red-500">Failed to analyze this video.</p>
					)}
					{analysisResult && (
						<div className="prose prose-neutral max-w-none">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{analysisResult}
							</ReactMarkdown>
						</div>
					)}
				</div>
			)}

			{jobStatus?.status === "done" && (
				<div className="border rounded-lg p-4">
					<h3 className="font-semibold mb-2">Playlist Analyses</h3>
					<div className="space-y-4">
						{videos.map((v) => {
							const txt = jobStatus.results[v.id];
							if (!txt) return null;
							return (
								<div key={v.id} className="border rounded p-3">
									<div className="font-medium mb-2">{v.title}</div>
									<div className="prose prose-neutral max-w-none text-sm">
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{txt}
										</ReactMarkdown>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
