import auth from "next-auth"

export default auth

export const config = {
  matcher: ["/dashboard/:path*", "/playlists/:path*"],
}
