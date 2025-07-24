import { render, screen } from "@testing-library/react";
import Header from "../header";
import { useSession } from "next-auth/react";

jest.mock("next-auth/react", () => ({
	__esModule: true,
	useSession: jest.fn(),
	signOut: jest.fn(),
}));

describe("Header", () => {
	it("shows sign-out button when authenticated", () => {
		(useSession as jest.Mock).mockReturnValue({
			data: { user: { name: "John" } },
			status: "authenticated",
		});
		render(<Header />);
		expect(
			screen.getByRole("button", { name: /sign out/i }),
		).toBeInTheDocument();
	});

	it("hides sign-out button when not authenticated", () => {
		(useSession as jest.Mock).mockReturnValue({
			data: null,
			status: "unauthenticated",
		});
		render(<Header />);
		expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
	});
});
