import { cn } from "../utils";

describe("cn", () => {
	it("should merge class names", () => {
		expect(cn("a", "b")).toBe("a b");
	});

	it("should handle conditional classes", () => {
		expect(cn("a", { b: true, c: false })).toBe("a b");
	});

	it("should merge tailwind classes correctly, with the last one winning", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
	});

	it("should handle arrays of classes", () => {
		expect(cn(["a", "b"], ["c", "d"])).toBe("a b c d");
	});

	it("should return an empty string for no inputs", () => {
		expect(cn()).toBe("");
	});

	it("should ignore falsy values", () => {
		expect(cn("a", null, "b", undefined, 0, false, "")).toBe("a b");
	});
});
