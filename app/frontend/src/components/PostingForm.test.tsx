import { fireEvent, render, screen } from "@testing-library/react";
import { createPosting, PostingRejected, viewRecruiterPostings, type JobPosting } from "@/lib/api";
import PostingForm from "./PostingForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  createPosting: vi.fn(),
  viewRecruiterPostings: vi.fn(),
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

async function submitTheForm() {
  const { container } = render(<PostingForm token="recruiter-token" />);
  await screen.findByText("Posting for Waco Health Partners");
  fireEvent.submit(container.querySelector("form")!);
}

describe("PostingForm", () => {
  beforeEach(() => {
    vi.mocked(viewRecruiterPostings).mockResolvedValue({
      organizationId: 2,
      organizationName: "Waco Health Partners",
      postings: [],
    });
  });

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

    await submitTheForm();

    expect(await screen.findByRole("status")).toHaveTextContent("Backend Developer — Posting #7 (DRAFT)");
    expect(vi.mocked(createPosting).mock.calls[0][0]).toBe("recruiter-token");
  });

  it("shows the backend's reason under the field it names", async () => {
    vi.mocked(createPosting).mockRejectedValue(new PostingRejected("Job title is required"));

    await submitTheForm();

    expect(await screen.findByText("Job title is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a reason that names no field above the buttons", async () => {
    vi.mocked(createPosting).mockRejectedValue(new PostingRejected("Organization not found"));

    await submitTheForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Organization not found");
  });

  it("offers to edit the draft it saved", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);

    await submitTheForm();

    expect(await screen.findByRole("link", { name: "Edit draft" })).toHaveAttribute(
      "href",
      "/recruiter/postings/7/edit",
    );
  });

  it.each([
    ["a failure that is not the recruiter's", new Error("Backend answered 500")],
    ["a refusal without a reason", new PostingRejected("")],
  ])("shows its own message for %s", async (_case, failure) => {
    vi.mocked(createPosting).mockRejectedValue(failure);

    await submitTheForm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save the posting. Please try again.");
  });

  it("submits the saved draft for approval", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...saved, postStatus: "PENDING_APPROVAL" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await submitTheForm();
    fireEvent.click(await screen.findByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText("Submitted for administrator review!")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/postings/7/submit");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer recruiter-token");
  });

  it("posts for the organization the recruiter acts for", async () => {
    vi.mocked(createPosting).mockResolvedValue(saved);

    await submitTheForm();

    await screen.findByRole("status");
    expect(vi.mocked(createPosting).mock.calls[0][1].organizationId).toBe(2);
  });

  it("cannot be saved by a recruiter who acts for no organization", async () => {
    vi.mocked(viewRecruiterPostings).mockResolvedValue({ organizationId: null, organizationName: null, postings: [] });

    render(<PostingForm token="recruiter-token" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("You are not an active member of any organization yet");
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();
  });
});
