"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Video {
	id: string;
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			default: {
				url: string;
				width: number;
				height: number;
			};
		};
		resourceId?: {
			videoId: string;
		};
	};
}

const fetchVideos = async (playlistId: string): Promise<Video[]> => {
	const response = await fetch(`/api/youtube/videos?playlistId=${playlistId}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

const analyzeVideo = async (videoId: string): Promise<{ analysis: string }> => {
	const response = await fetch("/api/analysis", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ videoId }),
	});
	if (!response.ok) {
		throw new Error("Failed to analyze video");
	}
	return response.json();
};

const bulkAnalyzePlaylist = async (
	playlistId: string,
): Promise<Record<string, string>> => {
	const response = await fetch("/api/analysis/playlist", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ playlistId }),
	});
	if (!response.ok) {
		throw new Error("Failed to analyze playlist");
	}
	return response.json();
};

export default function PlaylistPage() {
	const { data: session } = useSession();
	const params = useParams();
	const playlistId = params.id as string;

	const [analysisResult, setAnalysisResult] = useState<Record<string, string>>(
		{},
	);
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: videos = [],
		isLoading,
		error,
	} = useQuery<Video[]>({
		queryKey: ["videos", playlistId],
		queryFn: () => fetchVideos(playlistId),
		enabled: !!session && !!playlistId,
	});

	const analysisMutation = useMutation({
		mutationFn: analyzeVideo,
		onSuccess: (data, videoId) => {
			setAnalysisResult((prev) => ({ ...prev, [videoId]: data.analysis }));
		},
	});

	const bulkAnalysisMutation = useMutation({
		mutationFn: bulkAnalyzePlaylist,
		onSuccess: (data) => {
			setAnalysisResult((prev) => ({ ...prev, ...data }));
		},
	});

	const handleExport = () => {
		const csvContent = [
			["Video Title", "Analysis"],
			...filteredVideos.map((video) => {
				const videoId = video.snippet.resourceId?.videoId || video.id;
				return [
					`"${video.snippet.title.replace(/"/g, '""')}"`,
					`"${(analysisResult[videoId] || "").replace(/"/g, '""')}"`,
				];
			}),
		]
			.map((e) => e.join(","))
			.join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		if (link.href) {
			URL.revokeObjectURL(link.href);
		}
		link.href = URL.createObjectURL(blob);
		link.download = `playlist-analysis-${playlistId}.csv`;
		link.click();
	};

	const filteredVideos = useMemo(() => {
		return videos.filter((video) =>
			video.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [videos, searchTerm]);

	if (isLoading)
		return <div className="text-center mt-8">Loading videos...</div>;
	if (error)
		return (
			<div className="text-center mt-8 text-red-500">
				Error: {error.message}
			</div>
		);
	if (!session)
		return (
			<div className="text-center mt-8">Please sign in to view videos.</div>
		);

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Playlist Videos</h1>
				<div className="flex items-center space-x-2">
					<Input
						type="text"
						placeholder="Search videos..."
						className="max-w-sm"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<Button
						onClick={() => bulkAnalysisMutation.mutate(playlistId)}
						disabled={bulkAnalysisMutation.isPending}
					>
						{bulkAnalysisMutation.isPending
							? "Analyzing All..."
							: "Analyze All"}
					</Button>
					<Button onClick={handleExport} variant="outline">
						Export CSV
					</Button>
				</div>
			</div>
			{filteredVideos.length === 0 ? (
				<p>No videos found in this playlist.</p>
			) : (
				<div className="space-y-4">
					{filteredVideos.map((video) => {
						const videoId = video.snippet.resourceId?.videoId || video.id;
						return (
							<div key={videoId} className="border rounded-lg p-4">
								<div className="flex">
									<Image
										src={video.snippet.thumbnails.default.url}
										alt={video.snippet.title}
										width={video.snippet.thumbnails.default.width}
										height={video.snippet.thumbnails.default.height}
										className="w-48 h-27 object-cover rounded-md mr-4"
									/>
									<div className="flex-grow">
										<h2 className="text-xl font-semibold">
											{video.snippet.title}
										</h2>
										<p className="text-gray-400 mt-2 text-sm">
											{video.snippet.description.substring(0, 200)}...
										</p>
									</div>
									<Button
										onClick={() => analysisMutation.mutate(videoId)}
										disabled={
											analysisMutation.isPending &&
											analysisMutation.variables === videoId
										}
										className="self-start"
									>
										{analysisMutation.isPending &&
										analysisMutation.variables === videoId
											? "Analyzing..."
											: "Analyze"}
									</Button>
								</div>
								{analysisResult[videoId] && (
									<div className="mt-4 p-4 bg-secondary rounded-lg whitespace-pre-wrap font-mono text-sm">
										{analysisResult[videoId]}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
