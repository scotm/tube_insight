type Stamp = number;

// Simple sliding window counter per key in memory.
// Not production-grade; good enough for local dev and MVP.
export class SlidingWindowLimiter {
	private readonly windowMs: number;
	private readonly max: number;
	private readonly hits: Map<string, Stamp[]> = new Map();

	constructor(max: number, windowMs: number) {
		this.max = max;
		this.windowMs = windowMs;
	}

	allow(key: string): {
		allowed: boolean;
		remaining: number;
		retryAfter?: number;
	} {
		const now = Date.now();
		const cutoff = now - this.windowMs;
		const arr = this.hits.get(key) ?? [];
		const pruned = arr.filter((ts) => ts > cutoff);
		if (pruned.length >= this.max) {
			const retryAfter = Math.ceil((pruned[0] - cutoff) / 1000);
			this.hits.set(key, pruned);
			return { allowed: false, remaining: 0, retryAfter };
		}
		pruned.push(now);
		this.hits.set(key, pruned);
		return { allowed: true, remaining: Math.max(0, this.max - pruned.length) };
	}
}

// Global limiter instances
export const analysisLimiter = new SlidingWindowLimiter(10, 5 * 60 * 1000); // 10 requests / 5 minutes
