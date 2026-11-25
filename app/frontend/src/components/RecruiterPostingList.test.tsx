import { fireEvent, render, screen, within } from "@testing-library/react";
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
    { postingId: 6, title: "Nurse Scheduler", postStatus: "RETURNED", closingReason: null, applicationsByStage: stages(0, 0, 0, 0) },
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

  const row = (title: string) => screen.getByText(title).closest("li")!;
  const findRow = async (title: string) => (await screen.findByText(title)).closest("li")!;

  it("offers to revise a returned posting and continue a draft, on the edit page", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    render(<RecruiterPostingList token="t" />);

    expect(within(await findRow("Nurse Scheduler")).getByRole("link", { name: "Revise" })).toHaveAttribute("href", "/recruiter/postings/6/edit");
    expect(within(row("Clinical Data Engineer")).getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/recruiter/postings/4/edit");
    expect(within(row("Medical Records Clerk")).queryByRole("link")).toBeNull();
    expect(within(row("Front Desk Coordinator")).queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("closes a published posting only after the recruiter confirms", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, answer))
      .mockResolvedValueOnce(reply(200, { jobPostId: 1, postStatus: "CLOSED", closingReason: "Closed by recruiter" }));
    render(<RecruiterPostingList token="t" />);

    fireEvent.click(within(await findRow("Data Analyst")).getByRole("button", { name: "Close" }));
    const dialog = screen.getByRole("dialog", { name: "Close Data Analyst?" });
    expect(dialog).toHaveTextContent("cannot be opened again");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole("button", { name: "Close posting, final" }));

    expect(await within(row("Data Analyst")).findByText("Closed · by recruiter")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toMatch(/\/api\/postings\/1\/close$/);
    expect(init.method).toBe("POST");
  });

  it("goes back without closing", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    render(<RecruiterPostingList token="t" />);

    fireEvent.click(within(await findRow("Data Analyst")).getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(row("Data Analyst")).getByText("Published")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the reason when the backend refuses to close", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, answer))
      .mockResolvedValueOnce(
        new Response("Only the recruiter who created this posting can close it", {
          status: 403,
          headers: { "Content-Type": "text/plain" },
        }),
      );
    render(<RecruiterPostingList token="t" />);

    fireEvent.click(within(await findRow("Data Analyst")).getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Close posting, final" }));

    expect(await within(row("Data Analyst")).findByRole("alert")).toHaveTextContent(
      "Only the recruiter who created this posting can close it",
    );
    expect(within(row("Data Analyst")).getByText("Published")).toBeInTheDocument();
  });
});
