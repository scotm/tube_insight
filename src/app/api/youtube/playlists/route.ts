import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlaylists } from "@/lib/youtube";

export async function GET() {
	const session = await auth();
	if (!(session as any)?.accessToken) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const playlists = await getPlaylists((session as any).accessToken);
		return NextResponse.json(playlists);
	} catch (error) {
		console.error("Error fetching playlists:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
