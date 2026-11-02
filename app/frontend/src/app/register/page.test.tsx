import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { serverSession } from "@/lib/serverSession";
import RegisterPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

// `/register`, screen visitor-register (spec/screens); UC-02 Register as Applicant
describe("register page", () => {
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(redirect).mockClear();
  });

  it("puts the eyebrow, title and subtitle above the form", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await RegisterPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Applicant account")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByText("It is ready at once. Next you add a resume, then you can apply.")).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Registration" })).toBeInTheDocument();
  });

  it("points a recruiter to recruiter registration under the form (extension 1a)", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await RegisterPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Register your organization" })).toHaveAttribute(
      "href",
      "/recruiter/register",
    );
    expect(screen.getByText(/^Hiring\?/)).toHaveTextContent("Hiring? Register your organization instead.");
    expect(screen.queryByRole("link", { name: /Log in/ })).not.toBeInTheDocument();
  });

  it("sends a logged-in user to their profile (precondition)", async () => {
    vi.mocked(serverSession).mockResolvedValue({
      token: "t",
      user: { firstName: "Pat", lastName: "Kim", email: "pat@example.com", phone: null, role: "APPLICANT" },
    });

    await expect(RegisterPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/profile");
  });
});
