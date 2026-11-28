import { fireEvent, render, screen, within } from "@testing-library/react";
import type { PostingApplicants } from "@/lib/api";
import RecruiterPostingApplicants from "./RecruiterPostingApplicants";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const answer: PostingApplicants = {
  postingId: 7,
  title: "Data Analyst",
  applicants: [
    { applicationId: 31, name: "Chris Alvarez", stage: "APPLIED" },
    { applicationId: 32, name: "Hannah Brooks", stage: "APPLIED" },
    { applicationId: 33, name: "Omar Haddad", stage: "SCREENING" },
    { applicationId: 34, name: "Grace Liu", stage: "OFFER" },
  ],
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("RecruiterPostingApplicants", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows the posting, a count for each stage, and the applicants at the first stage", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));

    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    expect(await screen.findByRole("heading", { name: "Data Analyst" })).toBeInTheDocument();
    const stages = within(screen.getByRole("navigation", { name: "Stages" }));
    expect(stages.getByRole("button", { name: /^2\s*Applied$/ })).toHaveAttribute("aria-current", "true");
    expect(stages.getByRole("button", { name: /^1\s*Screening$/ })).toBeInTheDocument();
    expect(stages.getByRole("button", { name: /^0\s*Interview$/ })).toBeInTheDocument();
    expect(stages.getByRole("button", { name: /^1\s*Offer$/ })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      "Chris AlvarezOpen",
      "Hannah BrooksOpen",
    ]);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/recruiter\/postings\/7$/);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer t");
  });

  it("lists the applicants of another stage when its count is chosen", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    fireEvent.click(await screen.findByRole("button", { name: /Screening/ }));

    expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual(["Omar HaddadOpen"]);
    expect(screen.getByRole("button", { name: /Screening/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /Applied/ })).not.toHaveAttribute("aria-current");
  });

  it("opens the review of an applicant", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    const open = await screen.findByRole("link", { name: "Open Chris Alvarez" });

    expect(open).toHaveAttribute("href", "/recruiter/applications/31");
    expect(screen.getByRole("link", { name: /Postings/ })).toHaveAttribute("href", "/recruiter/postings");
  });

  it("says so when the posting has no applications", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { postingId: 7, title: "Data Analyst", applicants: [] }));

    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    expect(await screen.findByText("No applications.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Stages" })).not.toBeInTheDocument();
  });

  it("answers a posting that is not found, or is another organization's, with the same words", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Job posting 9 not found", { status: 404 }));

    render(<RecruiterPostingApplicants token="t" postingId={9} />);

    expect(await screen.findByText("There is no posting at this address.")).toBeInTheDocument();
  });

  it("asks to log in again when the session has ended", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));

    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    expect(await screen.findByText("Your session has ended")).toBeInTheDocument();
  });

  it("says the applicants could not be loaded when the backend fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));

    render(<RecruiterPostingApplicants token="t" postingId={7} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The applicants could not be loaded");
  });
});
