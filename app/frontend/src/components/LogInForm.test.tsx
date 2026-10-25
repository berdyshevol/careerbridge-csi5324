import { fireEvent, render, screen } from "@testing-library/react";
import { LogInRefused, logIn } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import LogInForm from "./LogInForm";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  logIn: vi.fn(),
}));

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("LogInForm", () => {
  afterEach(() => {
    vi.mocked(logIn).mockReset();
    replace.mockReset();
    refresh.mockReset();
    clearSession();
  });

  it("keeps the session and goes back where the user came from", async () => {
    vi.mocked(logIn).mockResolvedValue({
      token: "t",
      user: { firstName: "Jordan", lastName: "Lee", email: "jordan.lee@example.com", phone: null, role: "APPLICANT" },
    });
    render(<LogInForm next="/jobs/3/apply" />);

    submit("jordan.lee@example.com", "secret-1");

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/jobs/3/apply"));
    expect(logIn).toHaveBeenCalledWith("jordan.lee@example.com", "secret-1");
    expect(readSession()?.user.firstName).toBe("Jordan");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the backend's reason and stays on the form", async () => {
    vi.mocked(logIn).mockRejectedValue(new LogInRefused("The email or password is incorrect."));
    render(<LogInForm />);

    submit("jordan.lee@example.com", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is incorrect.");
    expect(replace).not.toHaveBeenCalled();
    expect(readSession()).toBeNull();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("does not show a server error report as the reason", async () => {
    vi.mocked(logIn).mockRejectedValue(new Error("Backend answered 500"));
    render(<LogInForm />);

    submit("jordan.lee@example.com", "secret-1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to log in. Please try again.");
  });
});
