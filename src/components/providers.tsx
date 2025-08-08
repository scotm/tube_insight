"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ToastProvider, Toaster } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<ReactQueryDevtools initialIsOpen={false} />
				{children}
				<Toaster />
			</ToastProvider>
		</QueryClientProvider>
	);
}
