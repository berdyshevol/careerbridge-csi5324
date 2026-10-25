import { fireEvent, render, screen } from "@testing-library/react";
import { createPosting, PostingRejected, type JobPosting } from "@/lib/api";
import PostingForm from "./PostingForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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
  const { container } = render(<PostingForm token="recruiter-token" />);
  fireEvent.submit(container.querySelector("form")!);
}

describe("PostingForm", () => {
  afterEach(() => {
    vi.mocked(createPosting).mockReset();
    vi.unstubAllGlobals();
  });

  it("offers the locations the job board can filter by", () => {
    render(<PostingForm token="recruiter-token" />);

    const location = screen.getByLabelText("Location");
    expect([...location.querySelectorAll("option:not([disabled])")].map((option) => option.textContent)).toEqual([
      "On-site",
      "Hybrid",
      "Remote",
    ]);
  });

  it("confirms the draft the backend saved", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);

    submitTheForm();

    expect(await screen.findByRole("status")).toHaveTextContent("Backend Developer — Posting #7 (DRAFT)");
    expect(vi.mocked(createPosting).mock.calls[0][0]).toBe("recruiter-token");
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
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer recruiter-token");
  });
});
