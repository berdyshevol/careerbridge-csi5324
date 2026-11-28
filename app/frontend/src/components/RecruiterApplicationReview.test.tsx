import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import RecruiterApplicationReview from "./RecruiterApplicationReview";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const answer = {
  applicationId: 31,
  postingId: 7,
  postingTitle: "Data Analyst",
  applicantName: "Jordan Lee",
  stage: "INTERVIEW",
  resume: { fileName: "jordan-lee.pdf", fileType: "application/pdf", fileSize: 2048, downloadable: true },
  profile: {
    email: "jordan.lee@example.com",
    phone: "(512) 555-0193",
    location: "Austin, TX",
    headline: "Analyst moving from retail to healthcare",
  },
  history: [
    { stage: "APPLIED", date: "2026-10-09" },
    { stage: "SCREENING", date: "2026-10-14" },
    { stage: "INTERVIEW", date: "2026-10-20" },
  ],
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("RecruiterApplicationReview", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows the applicant, the resume copy, the profile and this application's stage history", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));

    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    expect(await screen.findByRole("heading", { name: "Jordan Lee" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Data Analyst · Interview stage/ })).toHaveAttribute(
      "href",
      "/recruiter/postings/7",
    );
    expect(screen.getByText("jordan-lee.pdf")).toBeInTheDocument();
    expect(screen.getByText(/2 KB/)).toBeInTheDocument();
    const profile = within(screen.getByRole("heading", { name: "Profile" }).closest("section")!);
    expect(profile.getByText("jordan.lee@example.com")).toBeInTheDocument();
    expect(profile.getByText("(512) 555-0193")).toBeInTheDocument();
    expect(profile.getByText("Austin, TX")).toBeInTheDocument();
    expect(profile.getByText("Analyst moving from retail to healthcare")).toBeInTheDocument();
    const history = within(screen.getByRole("heading", { name: "Stage history" }).closest("section")!);
    expect(history.getAllByRole("listitem").map((entry) => entry.textContent)).toEqual([
      "AppliedOct 9, 2026",
      "ScreeningOct 14, 2026",
      "InterviewOct 20, 2026",
    ]);
  });

  it("draws no action: moving, rejecting and recording belong to later tickets", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));

    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    await screen.findByRole("heading", { name: "Jordan Lee" });
    expect(screen.queryByRole("button", { name: /Reject|Move|offer|interview/i })).not.toBeInTheDocument();
  });

  it("says when a detail was not given", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, { ...answer, profile: { ...answer.profile, phone: null, location: null, headline: null } }),
    );

    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    await screen.findByRole("heading", { name: "Profile" });
    expect(screen.getAllByText("Not given")).toHaveLength(3);
  });

  it("downloads the resume copy with the session token", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    fetchMock.mockResolvedValueOnce(new Response(new Blob(["pdf"]), { status: 200 }));
    const createObjectURL = vi.fn(() => "blob:resume");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    fireEvent.click(await screen.findByRole("button", { name: "Download jordan-lee.pdf" }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/recruiter\/applications\/31\/resume$/);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer t");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:resume");
    click.mockRestore();
  });

  it("says so when the resume could not be downloaded", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, answer));
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    fireEvent.click(await screen.findByRole("button", { name: "Download jordan-lee.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The resume could not be downloaded");
  });

  it("offers no download for a copy that has no file", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, { ...answer, resume: { ...answer.resume, downloadable: false } }),
    );

    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    expect(await screen.findByText("The file of this copy was not kept.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download/ })).not.toBeInTheDocument();
  });

  it("answers an application that is not found, or is another organization's, with the same words", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Application 9 not found", { status: 404 }));

    render(<RecruiterApplicationReview token="t" applicationId={9} />);

    expect(await screen.findByText("There is no application at this address.")).toBeInTheDocument();
  });

  it("asks to log in again when the session has ended", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 403 }));

    render(<RecruiterApplicationReview token="t" applicationId={31} />);

    expect(await screen.findByText("Your session has ended")).toBeInTheDocument();
  });
});
