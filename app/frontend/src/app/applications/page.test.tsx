import { render, screen } from "@testing-library/react";
import { SessionEnded, viewApplications, type Applications, type ApplicationSummary } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import ApplicationsPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewApplications: vi.fn(),
}));
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

function as(role: Role): Session {
  return { token: "t", user: { firstName: "Jordan", lastName: "Lee", email: "jordan@example.com", phone: null, role } };
}

const offerApp: ApplicationSummary = {
  applicationId: 1,
  postingId: 4,
  title: "Data Analyst",
  organizationName: "Brazos Health",
  location: "On-site",
  employmentType: "Full-time",
  applicationStatus: "Offer",
  active: true,
  dateApplied: "2026-10-01",
  lastStageChangeDate: "2026-10-28",
};

const interviewApp: ApplicationSummary = {
  applicationId: 2,
  postingId: 3,
  title: "Junior BI Developer",
  organizationName: "Riverbend Credit Union",
  location: "Remote",
  employmentType: "Full-time",
  applicationStatus: "Interview",
  active: true,
  dateApplied: "2026-10-06",
  lastStageChangeDate: "2026-10-22",
};

const rejectedApp: ApplicationSummary = {
  applicationId: 3,
  postingId: 9,
  title: "Marketing Analyst",
  organizationName: "Cedar & Pine Studio",
  location: "Hybrid",
  employmentType: "Full-time",
  applicationStatus: "Rejected",
  active: false,
  dateApplied: "2026-09-25",
  lastStageChangeDate: "2026-10-20",
};

const sampleDesk: Applications = {
  all: [offerApp, interviewApp, rejectedApp],
  active: [
    { ...offerApp, applicationStatus: "Offer" },
    { ...interviewApp, applicationStatus: "Interview" },
  ],
  appliedPostingIds: [4, 3, 9],
  activeApplicationCount: 2,
  applicationLimit: 5,
};

describe("ApplicationsPage", () => {
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(viewApplications).mockReset();
  });

  it("asks a visitor to log in and come back to /applications", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Log in to see your applications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Fapplications");
    expect(viewApplications).not.toHaveBeenCalled();
  });

  it("restricts /applications to applicant accounts", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("RECRUITER"));
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Applicants only" })).toBeInTheDocument();
  });

  it("shows SessionEnded notice when the token is rejected", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockRejectedValue(new SessionEnded());
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Your session has ended" })).toBeInTheDocument();
  });

  it("shows BackendDown when the backend fails", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockRejectedValue(new Error("500"));
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("alert")).toHaveTextContent(/not answering/);
  });

  it("shows the empty state linking to /jobs when the applicant has no applications (ext 2a)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue({
      all: [],
      active: [],
      appliedPostingIds: [],
      activeApplicationCount: 0,
      applicationLimit: 5,
    });
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("of 5 active")).toBeInTheDocument();
    expect(screen.getByText("You have not applied to any job yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find open jobs" })).toHaveAttribute("href", "/jobs");
    expect(screen.queryByRole("navigation", { name: "Filter applications" })).not.toBeInTheDocument();
  });

  it("renders all applications with the active count and filter tabs (FR-UC05.1, FR-UC05.8)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue(sampleDesk);
    render(await ApplicationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "Applications" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("of 5 active")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Review offer" })).toHaveAttribute("href", "/applications/1");
  });

  it("filters to active applications (ext 2b, FR-UC05.7)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue(sampleDesk);
    render(await ApplicationsPage({ searchParams: Promise.resolve({ filter: "active" }) }));

    expect(screen.getByRole("link", { name: "Active" })).toHaveAttribute("aria-current", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Marketing Analyst")).not.toBeInTheDocument();
  });

  it("filters to closed applications (ext 2b, FR-UC05.7)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue(sampleDesk);
    render(await ApplicationsPage({ searchParams: Promise.resolve({ filter: "closed" }) }));

    expect(screen.getByRole("link", { name: "Closed" })).toHaveAttribute("aria-current", "true");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Marketing Analyst")).toBeInTheDocument();
  });

  it("shows a filter empty state when no closed applications match", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplications).mockResolvedValue({
      all: [offerApp],
      active: [{ ...offerApp, applicationStatus: "Offer" }],
      appliedPostingIds: [4],
      activeApplicationCount: 1,
      applicationLimit: 5,
    });
    render(await ApplicationsPage({ searchParams: Promise.resolve({ filter: "closed" }) }));

    expect(screen.getByText("No closed applications.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show all applications" })).toHaveAttribute("href", "/applications");
  });
});
