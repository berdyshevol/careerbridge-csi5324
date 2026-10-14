import { fireEvent, render, screen } from "@testing-library/react";
import { createPosting, PostingRejected, type JobPosting } from "@/lib/api";
import NewPostingPage from "./page";

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  createPosting: vi.fn(),
}));

const saved: JobPosting = {
  jobPostId: 7,
  title: "Backend Developer",
  description: "",
  jobRequirements: "",
  location: "Remote",
  employmentType: "Full-time",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-13",
  applicationDeadline: "2999-12-31",
  postStatus: "DRAFT",
  organization: { organizationId: 1, name: "Brazos Analytics" },
};

function submitTheForm() {
  const { container } = render(<NewPostingPage />);
  fireEvent.submit(container.querySelector("form")!);
}

describe("NewPostingPage", () => {
  afterEach(() => {
    vi.mocked(createPosting).mockReset();
  });

  it("confirms the draft the backend saved", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);

    submitTheForm();

    expect(await screen.findByRole("status")).toHaveTextContent("Backend Developer — Posting #7 (DRAFT)");
  });

  it("shows the backend's reason when it refuses the posting", async () => {
    vi.mocked(createPosting).mockRejectedValue(new PostingRejected("Job title is required"));

    submitTheForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Job title is required");
  });

  it.each([
    ["a failure that is not the recruiter's", new Error("Backend answered 500")],
    ["a refusal without a reason", new PostingRejected("")],
  ])("shows its own message for %s", async (_case, failure) => {
    vi.mocked(createPosting).mockRejectedValue(failure);

    submitTheForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save the posting. Please try again.");
  });

  it("submits the saved draft for approval", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...saved, postStatus: "PENDING_APPROVAL" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    submitTheForm();
    fireEvent.click(await screen.findByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText("Submitted for administrator review!")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/postings/7/submit");
    vi.unstubAllGlobals();
  });
});
