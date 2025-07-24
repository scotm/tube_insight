import { render, screen, fireEvent } from "@testing-library/react";
import PlaylistPage from "../[id]/page";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

jest.mock("@tanstack/react-query");
jest.mock("next-auth/react");
jest.mock("next/navigation");
jest.mock("next/image", () => ({
	__esModule: true,
	default: (props: Record<string, unknown>) => <div {...props} />,
}));

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseParams = useParams as jest.Mock;

describe("PlaylistPage", () => {
	const videos = [
		{
			id: "1",
			snippet: {
				title: "Video 1",
				description: "desc",
				thumbnails: { default: { url: "t1.jpg", width: 120, height: 90 } },
				resourceId: { videoId: "1" },
			},
		},
	];

	beforeEach(() => {
		mockUseSession.mockReturnValue({ data: {}, status: "authenticated" });
		mockUseParams.mockReturnValue({ id: "123" });
		mockUseQuery.mockReturnValue({
			data: videos,
			isLoading: false,
			error: undefined,
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	test("analyze button updates state", () => {
		let mutateVideo: jest.Mock;
		mockUseMutation
			.mockImplementationOnce(({ onSuccess }) => {
				mutateVideo = jest.fn((id: string) =>
					onSuccess({ analysis: "analysis" }, id),
				);
				return { mutate: mutateVideo, isPending: false, variables: undefined };
			})
			.mockImplementationOnce(() => ({
				mutate: jest.fn(),
				isPending: false,
				variables: undefined,
			}));

		render(<PlaylistPage />);
		fireEvent.click(screen.getByText("Analyze"));
		expect(mutateVideo).toHaveBeenCalledWith("1");
		expect(screen.getByText("analysis")).toBeInTheDocument();
	});

	test("bulk analyze triggers once", () => {
		const bulkMutate = jest.fn();
		mockUseMutation
			.mockImplementationOnce(() => ({
				mutate: jest.fn(),
				isPending: false,
				variables: undefined,
			}))
			.mockImplementationOnce(({ onSuccess }) => {
				return {
					mutate: jest.fn((_id: string) => {
						bulkMutate();
						onSuccess({ 1: "analysis" });
					}),
					isPending: false,
					variables: undefined,
				};
			});

		render(<PlaylistPage />);
		fireEvent.click(screen.getByText("Analyze All"));
		expect(bulkMutate).toHaveBeenCalledTimes(1);
	});

	test("CSV export creates a downloadable link", () => {
		mockUseMutation
			.mockImplementationOnce(() => ({
				mutate: jest.fn(),
				isPending: false,
				variables: undefined,
			}))
			.mockImplementationOnce(() => ({
				mutate: jest.fn(),
				isPending: false,
				variables: undefined,
			}));

		const createElementSpy = jest.spyOn(document, "createElement");
		const linkMock = {
			href: "",
			download: "",
			click: jest.fn(),
		} as unknown as HTMLAnchorElement;
		createElementSpy.mockReturnValue(linkMock);
		jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:123");
		jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

		render(<PlaylistPage />);
		fireEvent.click(screen.getByText("Export CSV"));

		expect(createElementSpy).toHaveBeenCalledWith("a");
		expect(linkMock.download).toBe("playlist-analysis-123.csv");
		expect(linkMock.click).toHaveBeenCalled();
	});
});
