import { render, screen, within } from "@testing-library/react";
import type { RecruiterPostings } from "@/lib/api";
import RecruiterPostingList from "./RecruiterPostingList";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const stages = (applied: number, screening: number, interview: number, offer: number) => ({
  APPLIED: applied,
  SCREENING: screening,
  INTERVIEW: interview,
  OFFER: offer,
});

const answer: RecruiterPostings = {
  organizationName: "Brazos Health",
  postings: [
    { postingId: 1, title: "Data Analyst", postStatus: "PUBLISHED", closingReason: null, applicationsByStage: stages(7, 5, 3, 1) },
    { postingId: 2, title: "Patient Billing Specialist", postStatus: "PUBLISHED", closingReason: null, applicationsByStage: stages(5, 0, 2, 1) },
    { postingId: 3, title: "Medical Records Clerk", postStatus: "PENDING_APPROVAL", closingReason: null, applicationsByStage: stages(0, 0, 0, 0) },
    { postingId: 4, title: "Clinical Data Engineer", postStatus: "DRAFT", closingReason: null, applicationsByStage: stages(0, 0, 0, 0) },
    { postingId: 5, title: "Front Desk Coordinator", postStatus: "CLOSED", closingReason: "Filled", applicationsByStage: stages(0, 0, 0, 0) },
  ],
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("RecruiterPostingList", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("lists each posting with its status and the applications at each stage", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByText("Every posting of Brazos Health, with its status.")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]).getByText("7 Applied, 5 Screening, 3 Interview, 1 Offer")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Published")).toBeInTheDocument();
    // A stage with none is left out of the line
    expect(within(rows[1]).getByText("5 Applied, 2 Interview, 1 Offer")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Waiting for the administrator")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Pending approval")).toBeInTheDocument();
    expect(within(rows[3]).getByText("Visible only to Brazos Health recruiters")).toBeInTheDocument();
    // A published or closed posting with none shows every stage at zero
    expect(within(rows[4]).getByText("0 Applied, 0 Screening, 0 Interview, 0 Offer")).toBeInTheDocument();
    expect(within(rows[4]).getByText("Closed · Filled")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/recruiter/postings"),
      expect.objectContaining({ headers: { Authorization: "Bearer t" } }),
    );
  });

  it("offers a new posting", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByRole("link", { name: "New posting" })).toHaveAttribute("href", "/recruiter/postings/new");
  });

  it("says so when the organization has no postings", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { organizationName: "Brazos Health", postings: [] }));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByText(/Brazos Health has no postings yet/)).toBeInTheDocument();
  });

  it("shows nothing of an organization when the recruiter acts for none", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { organizationName: null, postings: [] }));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByText(/not acting for an organization/)).toBeInTheDocument();
  });

  it("asks to log in again when the backend refuses the token", async () => {
    fetchMock.mockResolvedValueOnce(reply(401, ""));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByRole("heading", { name: "Your session has ended" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Frecruiter%2Fpostings");
  });

  it("shows the failure instead of an empty list when the backend errors", async () => {
    fetchMock.mockResolvedValueOnce(reply(500, ""));

    render(<RecruiterPostingList token="t" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
  });
});
