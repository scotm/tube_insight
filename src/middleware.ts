import { auth } from "@/lib/auth";

export default auth;

export const config = {
	matcher: ["/dashboard/:path*"],
};
