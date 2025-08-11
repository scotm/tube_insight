import * as analysisRepo from "@/db/repositories/analysis";
import { generativeModel } from "@/lib/gemini";
import * as youtube from "@/lib/youtube";
import type { Job } from "../analysisQueue";
import { sha256Hex } from "../hash";

// Mock dependencies
jest.mock("@/db/repositories/analysis");
jest.mock("@/lib/gemini", () => ({
	generativeModel: {
		generateContent: jest.fn(),
	},
	modelName: "gemini-test-model",
}));
jest.mock("@/lib/youtube");
jest.mock("../hash");

// Mock implementations
const mockEnsureVideo = analysisRepo.ensureVideoByYoutubeId as jest.Mock;
const mockFindAnalysis = analysisRepo.findAnalysis as jest.Mock;
const mockUpsertAnalysis = analysisRepo.upsertAnalysis as jest.Mock;
const mockGenerateContent = generativeModel.generateContent as jest.Mock;
const mockGetVideos = youtube.getVideosForPlaylist as jest.Mock;
const mockSha256Hex = sha256Hex as jest.Mock;

// Use a consistent mock hash
const MOCK_PROMPT_HASH = "mock-prompt-hash";

// Helper to wait for job completion
async function waitForJob(
	getJob: (id: string) => Job | undefined,
	jobId: string,
) {
	for (let i = 0; i < 10; i++) {
		const job = getJob(jobId);
		if (job?.status === "done" || job?.status === "error") {
			return;
		}
		await new Promise((r) => setTimeout(r, 50));
	}
	throw new Error(`Job ${jobId} did not complete in time.`);
}

describe("analysisQueue", () => {
	beforeEach(() => {
		// Reset mocks before each test
		jest.clearAllMocks();
		mockSha256Hex.mockReturnValue(MOCK_PROMPT_HASH);
	});

	// Use jest.isolateModulesAsync to create a fresh instance of the queue for each test
	it("should enqueue a job, process it, and mark it as done", async () => {
		await jest.isolateModulesAsync(async () => {
			const { enqueuePlaylist, getJob } = await import("../analysisQueue");

			// Arrange: Mock API responses
			mockGetVideos.mockResolvedValue([
				{ snippet: { resourceId: { videoId: "vid1" } } },
			]);
			mockEnsureVideo.mockResolvedValue({ id: 1, youtubeId: "vid1" });
			mockFindAnalysis.mockResolvedValue(null); // No cache hit
			mockGenerateContent.mockResolvedValue({
				response: { text: () => "Test analysis" },
			});

			// Act: Enqueue the job
			const jobId = await enqueuePlaylist("test-token", "pl-1");
			const initialJob = getJob(jobId);

			// Assert: Initial state
			expect(initialJob).toBeDefined();
			expect(initialJob?.playlistId).toBe("pl-1");

			// Act: Wait for the job to complete
			await waitForJob(getJob, jobId);

			// Assert: Final state
			const finalJob = getJob(jobId);
			expect(finalJob?.status).toBe("done");
			expect(finalJob?.total).toBe(1);
			expect(finalJob?.completed).toBe(1);
			expect(finalJob?.results.vid1).toBe("Test analysis");

			// Assert: Mocks were called correctly
			expect(mockGetVideos).toHaveBeenCalledWith("test-token", "pl-1");
			expect(mockEnsureVideo).toHaveBeenCalledWith({ youtubeId: "vid1" });
			expect(mockFindAnalysis).toHaveBeenCalledWith({
				videoId: 1,
				model: "gemini-test-model",
				promptHash: MOCK_PROMPT_HASH,
			});
			expect(mockGenerateContent).toHaveBeenCalledTimes(1);
			expect(mockUpsertAnalysis).toHaveBeenCalledWith({
				videoId: 1,
				model: "gemini-test-model",
				promptHash: MOCK_PROMPT_HASH,
				summary: "Test analysis",
				insightsJson: { source: "gemini", path: "playlist" },
			});
		});
	});

	it("should use a cached analysis when available", async () => {
		await jest.isolateModulesAsync(async () => {
			const { enqueuePlaylist, getJob } = await import("../analysisQueue");

			// Arrange
			mockGetVideos.mockResolvedValue([{ id: "vid2" }]);
			mockEnsureVideo.mockResolvedValue({ id: 2, youtubeId: "vid2" });
			mockFindAnalysis.mockResolvedValue({ summary: "Cached analysis" }); // Cache hit

			// Act
			const jobId = await enqueuePlaylist("test-token", "pl-2");
			await waitForJob(getJob, jobId);

			// Assert
			const finalJob = getJob(jobId);
			expect(finalJob?.status).toBe("done");
			expect(finalJob?.results.vid2).toBe("Cached analysis");
			expect(mockGenerateContent).not.toHaveBeenCalled();
			expect(mockUpsertAnalysis).not.toHaveBeenCalled();
		});
	});

	it("should handle errors during job execution", async () => {
		await jest.isolateModulesAsync(async () => {
			const { enqueuePlaylist, getJob } = await import("../analysisQueue");

			// Arrange
			const apiError = new Error("YouTube API Failed");
			mockGetVideos.mockRejectedValue(apiError);

			// Act
			const jobId = await enqueuePlaylist("test-token", "pl-3");
			await waitForJob(getJob, jobId);

			// Assert
			const finalJob = getJob(jobId);
			expect(finalJob?.status).toBe("error");
			expect(finalJob?.error).toBe("YouTube API Failed");
			expect(finalJob?.completed).toBe(0);
		});
	});

	it("should handle videos with missing IDs gracefully", async () => {
		await jest.isolateModulesAsync(async () => {
			const { enqueuePlaylist, getJob } = await import("../analysisQueue");

			// Arrange
			mockGetVideos.mockResolvedValue([
				{ snippet: { resourceId: { videoId: "vid1" } } },
				{ snippet: { resourceId: {} } }, // Missing videoId
				null, // Null item
				{ id: "vid2" },
			]);
			mockEnsureVideo.mockResolvedValue({ id: 1, youtubeId: "any" });
			mockFindAnalysis.mockResolvedValue(null);
			mockGenerateContent.mockResolvedValue({ response: { text: () => "OK" } });

			// Act
			const jobId = await enqueuePlaylist("test-token", "pl-4");
			await waitForJob(getJob, jobId);

			// Assert
			const finalJob = getJob(jobId);
			expect(finalJob?.status).toBe("done");
			expect(finalJob?.total).toBe(2); // Only two valid IDs found
			expect(finalJob?.completed).toBe(2);
		});
	});
});
