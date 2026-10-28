import { fireEvent, render, screen } from "@testing-library/react";
import { AlreadyRegistered, register, RegistrationRefused } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import RegisterForm from "./RegisterForm";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  register: vi.fn(),
}));

function fill(fullName: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: fullName } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

// UC-02 Register as Applicant
describe("RegisterForm", () => {
  afterEach(() => {
    vi.mocked(register).mockReset();
    replace.mockReset();
    refresh.mockReset();
    clearSession();
  });

  it("logs the new applicant in and invites them to add a resume (step 5)", async () => {
    vi.mocked(register).mockResolvedValue({
      token: "t",
      user: { firstName: "Pat", lastName: "Kim", email: "pat@example.com", phone: null, role: "APPLICANT" },
    });
    render(<RegisterForm />);

    fill("Pat Kim", "pat@example.com", "Sunrise-2026x");

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/profile"));
    expect(register).toHaveBeenCalledWith("Pat Kim", "pat@example.com", "Sunrise-2026x");
    expect(readSession()?.user.firstName).toBe("Pat");
    expect(refresh).toHaveBeenCalled();
  });

  it("puts each reason next to its field (extensions 4a, 4c)", async () => {
    vi.mocked(register).mockRejectedValue(
      new RegistrationRefused({
        fullName: "Enter your first and last name.",
        password: "The password needs at least 10 characters, including a letter and a number.",
      }),
    );
    render(<RegisterForm />);

    fill("Pat", "pat@example.com", "short");

    expect(await screen.findByText("Enter your first and last name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "The password needs at least 10 characters, including a letter and a number.",
    );
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    expect(readSession()).toBeNull();
  });

  it("suggests logging in for an email that already has an account (extension 4b)", async () => {
    vi.mocked(register).mockRejectedValue(
      new AlreadyRegistered("An account already exists for this email address. Log in instead."),
    );
    render(<RegisterForm />);

    fill("Sam Rivera", "sam.rivera@example.com", "Sunrise-2026x");

    expect(await screen.findByRole("alert")).toHaveTextContent("An account already exists");
    expect(screen.getByRole("link", { name: "Go to log in" })).toHaveAttribute("href", "/login");
  });

  it("points a recruiter to recruiter registration (extension 3a)", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("link", { name: "Recruiting for an organization?" })).toHaveAttribute(
      "href",
      "/recruiter/register",
    );
  });

  it("does not show a server error report", async () => {
    vi.mocked(register).mockRejectedValue(new Error("Backend answered 500"));
    render(<RegisterForm />);

    fill("Pat Kim", "pat@example.com", "Sunrise-2026x");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to create the account. Please try again.");
  });
});
