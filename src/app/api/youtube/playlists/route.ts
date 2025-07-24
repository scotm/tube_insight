import { NextResponse } from "next/server";
import auth from "next-auth";
import { getPlaylists } from "@/lib/youtube";
import { authOptions } from "../../../../lib/auth";

export async function GET() {
	const session = auth(authOptions);
	if (!session) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		const playlists = await getPlaylists();
		return NextResponse.json(playlists);
	} catch (error) {
		console.error("Error fetching playlists:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
