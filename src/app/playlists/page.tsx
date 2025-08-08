"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { type Playlist, PlaylistArraySchema } from "@/types/youtube";

export default function PlaylistsPage() {
	const { data: session } = useSession();
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (session) {
			const fetchPlaylists = async () => {
				try {
					const response = await fetch("/api/youtube/playlists");
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					const parsed = PlaylistArraySchema.safeParse(data);
					if (!parsed.success)
						throw new Error("Unexpected playlist response shape");
					setPlaylists(parsed.data);
				} catch (e) {
					if (e instanceof Error) {
						setError(e.message);
					} else {
						setError("An unknown error occurred");
					}
				} finally {
					setLoading(false);
				}
			};
			fetchPlaylists();
		}
	}, [session]);

	if (loading)
		return <div className="text-center mt-8">Loading playlists...</div>;
	if (error)
		return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
	if (!session)
		return (
			<div className="text-center mt-8">Please sign in to view playlists.</div>
		);

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6">Your YouTube Playlists</h1>
			{playlists.length === 0 ? (
				<p>No playlists found.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{playlists.map((playlist) => (
						<Link key={playlist.id} href={`/playlists/${playlist.id}`}>
							<div className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200">
								{playlist.thumbnails.default ? (
									<Image
										src={playlist.thumbnails.default.url}
										alt={playlist.title}
										width={playlist.thumbnails.default.width}
										height={playlist.thumbnails.default.height}
										className="w-full h-48 object-cover rounded-md mb-4"
									/>
								) : (
									<div className="w-full h-48 bg-secondary rounded mb-4" />
								)}
								<h2 className="text-xl font-semibold">{playlist.title}</h2>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
