"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

type ToastVariant = "default" | "destructive" | "success" | "warning";

export type Toast = {
	id: string;
	title?: string;
	description?: string;
	variant?: ToastVariant;
	duration?: number; // ms
};

type ToastContextValue = {
	toasts: Toast[];
	show: (t: Omit<Toast, "id">) => void;
	dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const dismiss = useCallback((id: string) => {
		setToasts((t) => t.filter((x) => x.id !== id));
	}, []);

	const show = useCallback(
		(t: Omit<Toast, "id">) => {
			const id = uid();
			const toast: Toast = { id, duration: 4000, variant: "default", ...t };
			setToasts((prev) => [...prev, toast]);
			if (toast.duration && toast.duration > 0) {
				setTimeout(() => dismiss(id), toast.duration);
			}
		},
		[dismiss],
	);

	const value = useMemo(
		() => ({ toasts, show, dismiss }),
		[toasts, show, dismiss],
	);

	return (
		<ToastContext.Provider value={value}>{children}</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}

export function Toaster() {
	const { toasts, dismiss } = useToast();
	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 w-[90vw] max-w-sm">
			{toasts.map((t) => (
				<output
					key={t.id}
					className={[
						"rounded-md border p-3 shadow bg-background text-foreground",
						t.variant === "destructive" ? "border-red-300" : "border-border",
						t.variant === "success" ? "border-green-300" : "",
						t.variant === "warning" ? "border-yellow-300" : "",
					].join(" ")}
					aria-live="polite"
				>
					<div className="flex items-start gap-3">
						<div className="flex-1">
							{t.title && <div className="font-medium">{t.title}</div>}
							{t.description && (
								<div className="text-sm text-muted-foreground whitespace-pre-wrap">
									{t.description}
								</div>
							)}
						</div>
						<button
							onClick={() => dismiss(t.id)}
							type="button"
							className="text-sm text-muted-foreground hover:underline"
							aria-label="Dismiss"
						>
							Dismiss
						</button>
					</div>
				</output>
			))}
		</div>
	);
}
