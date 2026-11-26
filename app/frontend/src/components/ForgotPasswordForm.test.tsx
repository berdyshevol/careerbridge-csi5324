import { fireEvent, render, screen } from "@testing-library/react";
import { requestPasswordReset } from "@/lib/api";
import ForgotPasswordForm from "./ForgotPasswordForm";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  requestPasswordReset: vi.fn(),
}));

function ask(email: string) {
  render(<ForgotPasswordForm />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

// Log In, forgotten password, CO-LI.1
describe("ForgotPasswordForm", () => {
  afterEach(() => vi.resetAllMocks());

  it("says a link was sent without saying whether the account exists", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({});
    ask("pat@example.com");

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("If an account exists for pat@example.com, we sent it a link to choose a new password.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open the reset link" })).not.toBeInTheDocument();
    expect(requestPasswordReset).toHaveBeenCalledWith("pat@example.com");
  });

  it("shows the link itself in a demonstration without email", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ resetLink: "/reset-password?token=abc" });
    ask("pat@example.com");

    expect(await screen.findByRole("link", { name: "Open the reset link" })).toHaveAttribute(
      "href",
      "/reset-password?token=abc",
    );
  });

  it("asks to try again when the backend does not answer", async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(new Error("down"));
    ask("pat@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to send the link. Please try again.");
  });
});
