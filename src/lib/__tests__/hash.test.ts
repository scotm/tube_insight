import { sha256Hex } from "../hash";

describe("hash", () => {
	describe("sha256Hex", () => {
		it("should generate a valid SHA-256 hash for a given string", () => {
			const input = "test input";
			const expected =
				"9dfe6f15d1ab73af898739394fd22fd72a03db01834582f24bb2e1c66c7aaeae";
			const result = sha256Hex(input);
			expect(result).toBe(expected);
		});

		it("should generate different hashes for different inputs", () => {
			const input1 = "input 1";
			const input2 = "input 2";
			const hash1 = sha256Hex(input1);
			const hash2 = sha256Hex(input2);
			expect(hash1).not.toBe(hash2);
		});

		it("should generate the same hash for the same input", () => {
			const input = "consistent input";
			const hash1 = sha256Hex(input);
			const hash2 = sha256Hex(input);
			expect(hash1).toBe(hash2);
		});

		it("should handle empty string input", () => {
			const input = "";
			const expected =
				"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
			const result = sha256Hex(input);
			expect(result).toBe(expected);
		});
	});
});
