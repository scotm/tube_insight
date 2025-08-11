import { jest } from "@jest/globals";

const mockGetGenerativeModel = jest.fn(() => "mock-model");
const mockGoogleGenerativeAI = jest.fn(() => ({
	getGenerativeModel: mockGetGenerativeModel,
}));

jest.mock("@google/generative-ai", () => ({
	GoogleGenerativeAI: mockGoogleGenerativeAI,
}));

describe("gemini", () => {
	const ORIGINAL_ENV = process.env;

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...ORIGINAL_ENV };
		mockGoogleGenerativeAI.mockClear();
		mockGetGenerativeModel.mockClear();
	});

	afterAll(() => {
		process.env = ORIGINAL_ENV;
	});

	it("should throw an error if GEMINI_API_KEY is not set", () => {
		delete process.env.GEMINI_API_KEY;
		expect(() => {
			require("../gemini");
		}).toThrow("GEMINI_API_KEY is not defined in the environment.");
	});

	it("should throw an error if GEMINI_API_KEY is an empty string", () => {
		process.env.GEMINI_API_KEY = "";
		expect(() => {
			require("../gemini");
		}).toThrow("GEMINI_API_KEY is not defined in the environment.");
	});

	it("should initialize GoogleGenerativeAI with the API key and get the model", () => {
		process.env.GEMINI_API_KEY = "test-api-key";

		const geminiModule = require("../gemini");

		expect(mockGoogleGenerativeAI).toHaveBeenCalledWith("test-api-key");
		expect(mockGetGenerativeModel).toHaveBeenCalledWith({
			model: geminiModule.modelName,
		});
		expect(geminiModule.generativeModel).toBeDefined();
		expect(geminiModule.generativeModel).toBe("mock-model");
	});

	it("should export the correct modelName", () => {
		process.env.GEMINI_API_KEY = "test-api-key";
		const geminiModule = require("../gemini");
		expect(geminiModule.modelName).toBe("gemini-2.5-flash-lite");
	});
});
