import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "../page";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react");

const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("DashboardPage", () => {
	const playlists = [
		{
			id: "1",
			snippet: {
				title: "My Playlist",
				thumbnails: { default: { url: "thumb1.jpg", width: 100, height: 100 } },
			},
		},
		{
			id: "2",
			snippet: {
				title: "Another One",
				thumbnails: { default: { url: "thumb2.jpg", width: 100, height: 100 } },
			},
		},
	];

	const setup = () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		return render(
			<QueryClientProvider client={queryClient}>
				<DashboardPage />
			</QueryClientProvider>,
		);
	};

	beforeEach(() => {
		mockedUseSession.mockReturnValue({ data: { user: {} } } as any);
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(playlists),
			} as Response),
		) as jest.Mock;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("shows loading indicator", async () => {
		setup();
		expect(screen.getByText(/loading playlists/i)).toBeInTheDocument();
		await waitFor(() =>
			expect(screen.queryByText(/loading playlists/i)).not.toBeInTheDocument(),
		);
	});

	it("renders playlists", async () => {
		setup();
		expect(await screen.findByText("My Playlist")).toBeInTheDocument();
		expect(screen.getByText("Another One")).toBeInTheDocument();
	});

	it("filters playlists by search", async () => {
		setup();
		await screen.findByText("My Playlist");
		const input = screen.getByPlaceholderText(/search playlists/i);
		fireEvent.change(input, { target: { value: "another" } });
		expect(screen.queryByText("My Playlist")).not.toBeInTheDocument();
		expect(screen.getByText("Another One")).toBeInTheDocument();
	});
});
