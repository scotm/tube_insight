import { jest } from "@jest/globals";

import { SlidingWindowLimiter } from "../rateLimit";

describe("rateLimit", () => {
	describe("SlidingWindowLimiter", () => {
		let limiter: SlidingWindowLimiter;
		const windowMs = 1000; // 1 second window for testing
		const maxRequests = 3;

		beforeEach(() => {
			limiter = new SlidingWindowLimiter(maxRequests, windowMs);
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("should allow requests within the limit", () => {
			const key = "test-key";
			const result = limiter.allow(key);
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(maxRequests - 1);
		});

		it("should deny requests when limit is exceeded", () => {
			const key = "test-key";

			// Use all allowed requests
			for (let i = 0; i < maxRequests; i++) {
				limiter.allow(key);
			}

			// Next request should be denied
			const result = limiter.allow(key);
			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
			expect(result.retryAfter).toBeDefined();
		});

		it("should reset window after time passes", () => {
			const key = "test-key";

			// Use all allowed requests
			for (let i = 0; i < maxRequests; i++) {
				limiter.allow(key);
			}

			// Move time forward beyond window
			jest.advanceTimersByTime(windowMs + 100);

			// Next request should be allowed
			const result = limiter.allow(key);
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(maxRequests - 1);
		});

		it("should handle multiple keys independently", () => {
			const key1 = "test-key-1";
			const key2 = "test-key-2";

			// Use all allowed requests for key1
			for (let i = 0; i < maxRequests; i++) {
				limiter.allow(key1);
			}

			// key1 should be denied
			const result1 = limiter.allow(key1);
			expect(result1.allowed).toBe(false);

			// key2 should still be allowed
			const result2 = limiter.allow(key2);
			expect(result2.allowed).toBe(true);
			expect(result2.remaining).toBe(maxRequests - 1);
		});
	});
});
