import { fireEvent, render, screen } from "@testing-library/react";
import { NewPasswordRefused, ResetLinkRefused, resetPassword } from "@/lib/api";
import ResetPasswordForm from "./ResetPasswordForm";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  resetPassword: vi.fn(),
}));

function save(password: string) {
  render(<ResetPasswordForm token="abc" />);
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Save new password" }));
}

// Log In, forgotten password, CO-LI.2
describe("ResetPasswordForm", () => {
  afterEach(() => vi.resetAllMocks());

  it("saves the new password with the link and leads to Log in", async () => {
    vi.mocked(resetPassword).mockResolvedValue();
    save("New-password-2");

    expect(await screen.findByRole("heading", { name: "Your password is changed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(resetPassword).toHaveBeenCalledWith("abc", "New-password-2");
  });

  it("puts the reason for a weak password next to the field, and keeps the form", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new NewPasswordRefused("The password needs at least 10 characters, including a letter and a number."),
    );
    save("short");

    expect(
      await screen.findByText("The password needs at least 10 characters, including a letter and a number."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save new password" })).toBeInTheDocument();
  });

  it("offers a new link when this one no longer works", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ResetLinkRefused(true, "This link has expired. Ask for a new one."));
    save("New-password-2");

    expect(await screen.findByRole("alert")).toHaveTextContent("This link has expired. Ask for a new one.");
    expect(screen.getByRole("link", { name: "Ask for a new link" })).toHaveAttribute("href", "/forgot-password");
  });
});
