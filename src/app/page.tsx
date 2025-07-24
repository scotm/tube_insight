import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
			<h1 className="text-5xl font-bold mb-4">Welcome to TubeInsight</h1>
			<p className="text-xl text-muted-foreground mb-8">
				Analyze your YouTube playlists with the power of AI.
			</p>
			<Link href="/api/auth/signin">
				<Button size="lg">Get Started</Button>
			</Link>
		</div>
	);
}
