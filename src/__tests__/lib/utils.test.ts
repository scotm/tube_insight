import { cn } from "../../lib/utils";

describe("cn", () => {
	it("merges multiple class names", () => {
		expect(cn("p-2", "m-4")).toBe("p-2 m-4");
	});

	it("deduplicates conflicting Tailwind classes", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	it("handles conditional classes", () => {
		expect(cn("block", { hidden: true, bold: false })).toBe("block hidden");
	});
});
