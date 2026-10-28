import { render, screen } from "@testing-library/react";
import { SessionEnded, viewApplications, viewPosting, viewProfile, type JobPosting } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import ApplyPage from "./jobs/[id]/apply/page";
import ProfilePage from "./profile/page";
import NewPostingPage from "./recruiter/postings/new/page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewPosting: vi.fn(),
  viewApplications: vi.fn(),
  viewProfile: vi.fn(),
}));
const refresh = vi.fn();
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

const posting = { jobPostId: 2, title: "Data Analyst Intern" } as JobPosting;

function as(role: Role): Session {
  return { token: "t", user: { firstName: "Riley", lastName: "Chen", email: "r@example.com", phone: null, role } };
}

// Server pages: who may see what (UC-01 extensions 6a, 6c; ADR-0010)
describe("pages that need a log-in", () => {
  beforeEach(() => {
    vi.mocked(viewPosting).mockResolvedValue(posting);
  });
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(viewApplications).mockReset();
    vi.mocked(viewProfile).mockReset();
    refresh.mockReset();
  });

  it("asks a visitor who wants to apply to log in or register, and to come back (6a)", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await ApplyPage({ params: Promise.resolve({ id: "2" }) }));

    expect(screen.getByRole("heading", { name: "Log in to apply" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Fjobs%2F2%2Fapply");
    expect(screen.getByRole("link", { name: "New here? Register as an applicant" })).toHaveAttribute(
      "href",
      "/register?next=%2Fjobs%2F2%2Fapply",
    );
    expect(viewApplications).not.toHaveBeenCalled();
  });

  it("tells a recruiter that only applicants apply (6c)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("RECRUITER"));
    render(await ApplyPage({ params: Promise.resolve({ id: "2" }) }));

    expect(screen.getByText(/You are logged in as Riley Chen, recruiter\. Only applicant accounts can apply\./)).toBeInTheDocument();
  });

  it("ends a session the backend refused, so the header forgets it too", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockRejectedValue(new SessionEnded());
    render(await ApplyPage({ params: Promise.resolve({ id: "2" }) }));

    expect(screen.getByRole("heading", { name: "Your session has ended" })).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("answers a posting that does not exist with not found, before asking anyone to log in", async () => {
    vi.mocked(viewPosting).mockResolvedValue(null);
    vi.mocked(serverSession).mockResolvedValue(null);

    await expect(ApplyPage({ params: Promise.resolve({ id: "999" }) })).rejects.toThrow();
  });

  it("lets only a recruiter open the posting form", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await NewPostingPage());
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Frecruiter%2Fpostings%2Fnew");

    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    render(await NewPostingPage());
    expect(screen.getByText(/Only a recruiter creates job postings/)).toBeInTheDocument();
  });

  it("shows the profile only to an applicant", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("ADMINISTRATOR"));
    render(await ProfilePage());
    expect(screen.getByRole("heading", { name: "Applicants only" })).toBeInTheDocument();
  });

  it("shows an applicant their own profile from the backend", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewProfile).mockResolvedValue({
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan.lee@example.com",
      phone: null,
      resume: null,
    });
    render(await ProfilePage());

    expect(viewProfile).toHaveBeenCalledWith("t");
    expect(screen.getByLabelText("First name")).toHaveValue("Jordan");
    expect(screen.getByText(/No resume on file yet/)).toBeInTheDocument();
  });

  it("ends a session the backend refused on the profile", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewProfile).mockRejectedValue(new SessionEnded());
    render(await ProfilePage());

    expect(screen.getByRole("heading", { name: "Your session has ended" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/ })).toHaveAttribute("href", "/login?next=%2Fprofile");
  });
});
