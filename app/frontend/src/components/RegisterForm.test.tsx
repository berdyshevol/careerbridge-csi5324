import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("logs the new applicant in and invites them to add a resume (step 3)", async () => {
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

  it("puts each reason next to its field (extensions 2a, 2c)", async () => {
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
    await waitFor(() => expect(screen.getByLabelText("Full name")).toHaveFocus());
    expect(readSession()).toBeNull();
  });

  it("says under the email that an account exists and offers to log in instead (extension 2b)", async () => {
    vi.mocked(register).mockRejectedValue(
      new AlreadyRegistered("An account already exists for this email address. Log in instead."),
    );
    render(<RegisterForm next="/jobs/3/apply" />);

    fill("Sam Rivera", "sam.rivera@example.com", "Sunrise-2026x");

    expect(await screen.findByText(/An account already exists for this email\./)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "An account already exists for this email. Log in instead",
    );
    expect(screen.getByRole("link", { name: "Log in instead" })).toHaveAttribute(
      "href",
      "/login?next=%2Fjobs%2F3%2Fapply",
    );
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("states the password policy under the password (extension 2c)", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 10 characters, with a letter and a number.",
    );
  });

  it("holds only the three fields and a button that spans the card", () => {
    render(<RegisterForm />);
    const form = screen.getByRole("form", { name: "Registration" });
    expect(form.querySelectorAll("input")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Create account" })).toHaveClass("w-full");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not show a server error report", async () => {
    vi.mocked(register).mockRejectedValue(new Error("Backend answered 500"));
    render(<RegisterForm />);

    fill("Pat Kim", "pat@example.com", "Sunrise-2026x");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to create the account. Please try again.");
  });
});
