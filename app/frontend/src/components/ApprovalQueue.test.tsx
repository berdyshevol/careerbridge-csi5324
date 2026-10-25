import { fireEvent, render, screen } from "@testing-library/react";
import type { JobPosting } from "@/lib/api";
import { clearSession, saveSession, type Role, type Session } from "@/lib/session";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import ApprovalQueue from "./ApprovalQueue";

const pending: JobPosting = {
  jobPostId: 7,
  title: "Backend Developer",
  description: "",
  jobRequirements: "",
  location: "Remote",
  employmentType: "Full-time",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-13",
  applicationDeadline: "2026-11-30",
  postStatus: "PENDING_APPROVAL",
  organization: { organizationId: 1, name: "Brazos Analytics" },
};

function reply(status: number, body: unknown) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

function sessionOf(role: Role): Session {
  return {
    token: `token-of-${role}`,
    user: { firstName: "Avery", lastName: "Morgan", email: "admin@careerbridge.example", phone: null, role },
  };
}

async function signIn() {
  render(<ApprovalQueue session={sessionOf("ADMINISTRATOR")} />);
  await screen.findByRole("heading", { name: "Backend Developer" });
}

describe("ApprovalQueue", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    clearSession();
    refresh.mockReset();
  });

  it("sends the administrator's token and approves the posting", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, [pending]))
      .mockResolvedValueOnce(reply(200, { ...pending, postStatus: "PUBLISHED" }));

    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Approve & publish" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Posting #7 is approved and published.");
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("http://localhost:8080/api/admin/postings/7/approve");
    expect(init.headers.Authorization).toBe("Bearer token-of-ADMINISTRATOR");
    expect(screen.queryByRole("heading", { name: "Backend Developer" })).not.toBeInTheDocument();
  });

  it("says when an expired posting went back to the recruiters", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, [pending]))
      .mockResolvedValueOnce(
        reply(200, { ...pending, postStatus: "RETURNED", reviewComment: "Set a new deadline." }),
      );

    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Approve & publish" }));

    expect(await screen.findByRole("status")).toHaveTextContent("returned to the recruiters: Set a new deadline.");
  });

  it("asks for a reason before returning a posting", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, [pending]));

    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Return for corrections" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a reason");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("drops a posting another administrator already decided and says why", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, [pending]))
      .mockResolvedValueOnce(reply(409, "This posting was already decided: it is Published"));

    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Approve & publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already decided: it is Published");
    expect(screen.queryByRole("heading", { name: "Backend Developer" })).not.toBeInTheDocument();
  });

  it("asks a visitor to log in as an administrator, and calls nothing", () => {
    render(<ApprovalQueue session={null} />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=/admin/postings");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tells an applicant that only an administrator reviews postings", () => {
    render(<ApprovalQueue session={sessionOf("APPLICANT")} />);

    expect(screen.getByText(/Only an administrator reviews postings/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ends the session when the backend refuses the token", async () => {
    fetchMock.mockResolvedValueOnce(reply(401, ""));
    saveSession(sessionOf("ADMINISTRATOR"));
    render(<ApprovalQueue session={sessionOf("ADMINISTRATOR")} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Your session has ended");
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(document.cookie).not.toContain("cb_session=");
    expect(refresh).toHaveBeenCalled();
  });
});
