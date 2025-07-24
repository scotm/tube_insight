import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/layout/header";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "TubeInsight",
	description: "AI-Powered YouTube Video Analysis Platform",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Providers>
					<SessionProvider>
						<Header />
						<main>{children}</main>
					</SessionProvider>
				</Providers>
			</body>
		</html>
	);
}
