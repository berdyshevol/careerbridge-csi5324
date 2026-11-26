import { render, screen, within } from "@testing-library/react";
import {
  openPostingApprovalQueue,
  openRecruiterRequestQueue,
  searchPostings,
  viewApplications,
  viewProfile,
  viewRecruiterPostings,
  viewUsers,
  type Applications,
  type RecruiterPostings,
} from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import HomePage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  searchPostings: vi.fn(),
  viewApplications: vi.fn(),
  viewProfile: vi.fn(),
  viewRecruiterPostings: vi.fn(),
  openPostingApprovalQueue: vi.fn(),
  openRecruiterRequestQueue: vi.fn(),
  viewUsers: vi.fn(),
}));

function as(role: Role): Session {
  return {
    token: "t",
    user: {
      firstName: "Riley",
      lastName: "Chen",
      email: "r@example.com",
      phone: null,
      role,
    },
  };
}

// `/` by role: visitor-home and applicant-home (spec/screens); FR-UC01.1 and FR-UC01.2
describe("home page", () => {
  beforeEach(() => {
    vi.mocked(searchPostings).mockResolvedValue([]);
  });
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(searchPostings).mockReset();
  });

  describe("for a visitor", () => {
    beforeEach(() => {
      vi.mocked(serverSession).mockResolvedValue(null);
    });

    it("offers the search by keywords and location, sent to the job board", async () => {
      render(await HomePage());

      expect(screen.getByText("Open jobs from every organization")).toBeInTheDocument();
      // The mockup's front-page title is larger than any other page's, at every width
      expect(screen.getByRole("heading", { level: 1, name: "Find a job and apply." })).toHaveClass("text-4xl");

      const search = screen.getByRole("form", { name: "Search job postings" });
      expect(search).toHaveAttribute("action", "/jobs");
      expect(within(search).getByRole("searchbox", { name: "Keywords" })).toHaveAttribute("name", "keyword");
      const location = within(search).getByRole("combobox", { name: "Location" });
      expect(location).toHaveAttribute("name", "location");
      expect(location).toHaveDisplayValue("Any location");
      expect(within(search).getByRole("button", { name: "Search jobs" })).toHaveClass("btn-primary");
    });

    it("leads an applicant to register and an employer to register their organization", async () => {
      render(await HomePage());

      expect(screen.getByRole("heading", { name: "Looking for a job?" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Register as an applicant" })).toHaveAttribute("href", "/register");
      expect(screen.getByRole("heading", { name: "Hiring?" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Register your organization" })).toHaveAttribute(
        "href",
        "/recruiter/register",
      );
    });

    it("shows nothing the mockup leaves out and asks the backend for nothing", async () => {
      render(await HomePage());

      expect(screen.queryByRole("heading", { name: "Recently published" })).not.toBeInTheDocument();
      expect(searchPostings).not.toHaveBeenCalled();
    });
  });

  describe("for an applicant", () => {
    beforeEach(() => {
      vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    });

    it("welcomes them with their three actions, Find jobs the main one", async () => {
      const { container } = render(await HomePage());

      expect(screen.getByRole("heading", { level: 1, name: "Welcome" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Find jobs" })).toHaveAttribute("href", "/jobs");
      expect(screen.getByRole("link", { name: "Open applications" })).toHaveAttribute("href", "/applications");
      expect(screen.getByRole("link", { name: "Open profile" })).toHaveAttribute("href", "/profile");
      expect(container.querySelectorAll(".btn-primary")).toHaveLength(1);
      expect(screen.getByRole("link", { name: "Find jobs" })).toHaveClass("btn-primary");
    });

    // ADR-0013: the counts Applications already shows, from the same call
    it("counts their active applications against the limit and the offers to answer", async () => {
      vi.mocked(viewApplications).mockResolvedValue({
        all: [{ applicationStatus: "Offer" }, { applicationStatus: "Screening" }, { applicationStatus: "Rejected" }],
        activeApplicationCount: 2,
        applicationLimit: 5,
      } as unknown as Applications);
      render(await HomePage());

      expect(viewApplications).toHaveBeenCalledWith("t");
      expect(screen.getByRole("link", { name: "Active applications: 2 of 5" })).toHaveAttribute("href", "/applications");
      expect(screen.getByRole("link", { name: "Offers to answer: 1" })).toHaveAttribute("href", "/applications");
      expect(screen.queryByRole("heading", { name: "Recently published" })).not.toBeInTheDocument();
      expect(searchPostings).not.toHaveBeenCalled();
      expect(viewProfile).not.toHaveBeenCalled();
    });

    it("shows no number when the backend does not answer", async () => {
      vi.mocked(viewApplications).mockRejectedValue(new Error("down"));
      render(await HomePage());

      expect(screen.getByRole("link", { name: "Active applications: not available" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Offers to answer: not available" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Find jobs" })).toHaveClass("btn-primary");
    });
  });

  it("counts a recruiter's postings by status, each a link to Postings", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("RECRUITER"));
    vi.mocked(viewRecruiterPostings).mockResolvedValue({
      organizationId: 1,
      organizationName: "Pixel Labs",
      postings: ["PUBLISHED", "PUBLISHED", "PENDING_APPROVAL", "CLOSED"].map((postStatus, index) => ({ postingId: index, postStatus })),
    } as unknown as RecruiterPostings);
    render(await HomePage());

    expect(screen.getByRole("link", { name: "Published: 2" })).toHaveAttribute("href", "/recruiter/postings");
    expect(screen.getByRole("link", { name: "Pending approval: 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Returned: 0" })).toBeInTheDocument();
  });

  it("counts what waits for an administrator, and says so when one list does not load", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("ADMINISTRATOR"));
    vi.mocked(openPostingApprovalQueue).mockResolvedValue([{}, {}, {}] as never);
    vi.mocked(openRecruiterRequestQueue).mockRejectedValue(new Error("down"));
    vi.mocked(viewUsers).mockResolvedValue({ users: [{}, {}], usersByRole: {} } as never);
    render(await HomePage());

    expect(screen.getByRole("link", { name: "Postings to review: 3" })).toHaveAttribute("href", "/admin/postings");
    expect(screen.getByRole("link", { name: "Recruiter requests: not available" })).toHaveAttribute("href", "/admin/requests");
    expect(screen.getByRole("link", { name: "Users: 2" })).toHaveAttribute("href", "/admin/users");
  });

  it.each(["RECRUITER", "ADMINISTRATOR"] as const)(
    "keeps the open postings for a %s until their own home is built",
    async (role) => {
      vi.mocked(serverSession).mockResolvedValue(as(role));
      render(await HomePage());

      expect(screen.getByRole("heading", { name: "Welcome back, Riley" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Recently published" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Open applications" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Log in/ })).not.toBeInTheDocument();
      expect(viewApplications).not.toHaveBeenCalled();
    },
  );
});
