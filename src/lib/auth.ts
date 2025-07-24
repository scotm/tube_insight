import NextAuth, { type Session } from "next-auth";
// biome-ignore lint/correctness/noUnusedImports: For some reason this is required!
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth/jwt" {
	interface JWT {
		accessToken?: string;
	}
}

export interface SessionWithAccessToken extends Session {
	accessToken?: string;
}

export const {
	handlers: { GET, POST },
	auth,
} = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			authorization: {
				params: {
					scope:
						"openid https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
				},
			},
		}),
	],
	trustHost: true,
	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		async session({ session, token }) {
			// assert that the session is a SessionWithAccessToken
			if (!session) {
				throw new Error("Session is undefined");
			}
			if (!token.accessToken) {
				throw new Error("Token accessToken is undefined");
			}
			(session as SessionWithAccessToken).accessToken = token.accessToken;
			return session;
		},
	},
});
