import { fireEvent, render, screen } from "@testing-library/react";
import type { JobPosting } from "@/lib/api";
import AdminPostingsPage from "./page";

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

async function signIn() {
  render(<AdminPostingsPage />);
  fireEvent.change(screen.getByLabelText("Administrator username"), { target: { value: "admin" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
  fireEvent.click(screen.getByRole("button", { name: "Open approval dashboard" }));
  await screen.findByRole("heading", { name: "Backend Developer" });
}

describe("AdminPostingsPage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("sends the administrator's credentials and approves the posting", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, [pending]))
      .mockResolvedValueOnce(reply(200, { ...pending, postStatus: "PUBLISHED" }));

    await signIn();
    fireEvent.click(screen.getByRole("button", { name: "Approve & publish" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Posting #7 is approved and published.");
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("http://localhost:8080/api/admin/postings/7/approve");
    expect(init.headers.Authorization).toBe(`Basic ${btoa("admin:admin")}`);
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

  it("refuses wrong credentials", async () => {
    fetchMock.mockResolvedValueOnce(reply(401, ""));

    render(<AdminPostingsPage />);
    fireEvent.change(screen.getByLabelText("Administrator username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Open approval dashboard" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Administrator authentication failed");
  });
});
