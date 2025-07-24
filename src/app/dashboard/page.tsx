"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

interface Playlist {
	id: string;
	snippet: {
		title: string;
		thumbnails: {
			default: {
				url: string;
				width: number;
				height: number;
			};
		};
	};
}

const fetchPlaylists = async (): Promise<Playlist[]> => {
	console.log("fetching playlists");
	const response = await fetch("/api/youtube/playlists");
	console.log("response", response);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	const data = await response.json();
	console.log("data", data);
	return data;
};

export default function DashboardPage() {
	const { data: session } = useSession();
	const [searchTerm, setSearchTerm] = useState("");

	const {
		data: playlists = [],
		isLoading,
		error,
	} = useQuery<Playlist[]>({
		queryKey: ["playlists"],
		queryFn: fetchPlaylists,
		enabled: !!session,
	});

	const filteredPlaylists = useMemo(() => {
		return playlists.filter((playlist) =>
			playlist.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [playlists, searchTerm]);

	if (isLoading)
		return <div className="text-center mt-8">Loading playlists...</div>;
	if (error)
		return (
			<div className="text-center mt-8 text-red-500">
				Error: {error.message}
			</div>
		);
	if (!session)
		return (
			<div className="text-center mt-8">
				Please sign in to view your dashboard.
			</div>
		);

	return (
		<div className="container mx-auto p-4">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Your YouTube Playlists</h1>
				<Input
					type="text"
					placeholder="Search playlists..."
					className="max-w-sm"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>
			{filteredPlaylists.length === 0 ? (
				<p>No playlists found.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredPlaylists.map((playlist) => (
						<Link key={playlist.id} href={`/playlists/${playlist.id}`}>
							<div className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
								<Image
									src={playlist.snippet.thumbnails.default.url}
									alt={playlist.snippet.title}
									width={playlist.snippet.thumbnails.default.width}
									height={playlist.snippet.thumbnails.default.height}
									className="w-full h-48 object-cover rounded-md mb-4"
								/>
								<h2 className="text-xl font-semibold">
									{playlist.snippet.title}
								</h2>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
