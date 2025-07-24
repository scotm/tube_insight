import auth from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getPlaylists } from "@/lib/youtube"
import { NextResponse } from "next/server"

export async function GET() {
  const session = auth(authOptions)
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const playlists = await getPlaylists()
    return NextResponse.json(playlists)
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
