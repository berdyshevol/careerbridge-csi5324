import { render, screen } from "@testing-library/react";
import { SessionEnded, viewApplication, type ApplicationDetail } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";
import type { Role, Session } from "@/lib/session";
import ApplicationDetailPage from "./page";

vi.mock("@/lib/serverSession", () => ({ serverSession: vi.fn() }));
vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  viewApplication: vi.fn(),
}));
vi.mock("next/navigation", async (importActual) => ({
  ...(await importActual<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

function as(role: Role): Session {
  return { token: "t", user: { firstName: "Jordan", lastName: "Lee", email: "jordan@example.com", phone: null, role } };
}

const baseDetail: ApplicationDetail = {
  applicationId: 12,
  postingId: 3,
  title: "Backend Developer",
  organizationName: "Brazos Analytics",
  location: "Remote",
  employmentType: "Full-time",
  applicationStatus: "Interview",
  dateApplied: "2026-09-29",
  statusHistory: [
    { status: "Applied", date: "2026-09-29" },
    { status: "Screening", date: "2026-10-03" },
    { status: "Interview", date: "2026-10-08" },
  ],
  interviews: [
    {
      interviewId: 1,
      roundNumber: 1,
      scheduledTime: "2026-10-11T14:00:00",
      format: "On-site",
      location: "1200 Austin Ave, Waco",
    },
  ],
  offer: null,
  rejectionReason: null,
  rejectedAtStage: null,
  rejectionDate: null,
  withdrawnAt: null,
  availableActions: ["WITHDRAW"],
};

describe("ApplicationDetailPage", () => {
  afterEach(() => {
    vi.mocked(serverSession).mockReset();
    vi.mocked(viewApplication).mockReset();
  });

  it("asks a visitor to log in and come back to the application", async () => {
    vi.mocked(serverSession).mockResolvedValue(null);
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("heading", { name: "Log in to see this application" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fapplications%2F12",
    );
    expect(viewApplication).not.toHaveBeenCalled();
  });

  it("restricts the detail page to applicant accounts", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("RECRUITER"));
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("heading", { name: "Applicants only" })).toBeInTheDocument();
  });

  it("triggers notFound when the application does not exist or belongs to another applicant (ext *a)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue(null);

    await expect(ApplicationDetailPage({ params: Promise.resolve({ id: "999" }) })).rejects.toThrow();
  });

  it("shows SessionEnded notice when the token is rejected", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockRejectedValue(new SessionEnded());
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("heading", { name: "Your session has ended" })).toBeInTheDocument();
  });

  it("renders stage history and interview details for the applicant's application (FR-UC05.2, FR-UC05.3)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue(baseDetail);
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stage history" })).toBeInTheDocument();
    expect(screen.getByText(/On-site, 1200 Austin Ave, Waco/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw application" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /All applications/ })).toHaveAttribute("href", "/applications");
  });

  it("shows Offer terms and actions when the application is at Offer (FR-UC05.5, FR-UC07.1)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue({
      ...baseDetail,
      applicationStatus: "Offer",
      offer: {
        offerId: 5,
        dateExtended: "2026-10-28",
        startDate: "2027-07-19",
        salary: "68,000 USD per year",
        terms: "Hybrid after 90 days.",
        expirationDate: "2027-06-30",
        offerLetterFileName: "Brazos_Offer_Letter.pdf",
        status: "PENDING",
        responseDate: null,
        revision: 1,
        expired: false,
        canRespond: true,
      },
      availableActions: ["ACCEPT_OFFER", "DECLINE_OFFER"],
    });
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByText("Brazos Analytics offers you the Backend Developer position")).toBeInTheDocument();
    expect(screen.getByText("68,000 USD per year")).toBeInTheDocument();
    expect(screen.getByText("Hybrid after 90 days.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept offer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Withdraw application" })).not.toBeInTheDocument();
  });

  it("hides accept/decline buttons when the offer response deadline has passed (FR-UC07.6)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue({
      ...baseDetail,
      applicationStatus: "Offer",
      offer: {
        offerId: 6,
        dateExtended: "2026-10-28",
        startDate: "2026-12-07",
        salary: "68,000 USD per year",
        terms: "Hybrid after 90 days.",
        expirationDate: "2026-11-05",
        offerLetterFileName: null,
        status: "PENDING",
        responseDate: null,
        revision: 1,
        expired: true,
        canRespond: false,
      },
      availableActions: [],
    });
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByText(/This offer can no longer be accepted\./)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept offer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
  });

  it("shows rejection date, stage at rejection and reason when Rejected (FR-UC05.4, ext 4a, 4b)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue({
      ...baseDetail,
      applicationStatus: "Rejected",
      rejectedAtStage: "Interview",
      rejectionDate: "2026-10-20",
      rejectionReason: "Posting closed.",
      availableActions: [],
    });
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("status")).toHaveTextContent("Rejected on Oct 20, 2026 at Interview");
    expect(screen.getByRole("status")).toHaveTextContent("Reason: Posting closed.");
  });

  it("shows withdrawal date and no actions when Withdrawn (ext 4c)", async () => {
    vi.mocked(serverSession).mockResolvedValue(as("APPLICANT"));
    vi.mocked(viewApplication).mockResolvedValue({
      ...baseDetail,
      applicationStatus: "Withdrawn",
      withdrawnAt: "2026-10-18T16:00:00Z",
      availableActions: [],
    });
    render(await ApplicationDetailPage({ params: Promise.resolve({ id: "12" }) }));

    expect(screen.getByRole("status")).toHaveTextContent(/Withdrawn on Oct 18, 2026/);
    expect(screen.getByRole("status")).toHaveTextContent(/No further actions are available/);
  });
});

