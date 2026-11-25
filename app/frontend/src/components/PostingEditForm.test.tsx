import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  openPostingForEdit,
  PostingRejected,
  SessionEnded,
  submitJobPosting,
  updatePosting,
  type JobPosting,
} from "@/lib/api";
import PostingEditForm from "./PostingEditForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/api", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/api")>()),
  openPostingForEdit: vi.fn(),
  updatePosting: vi.fn(),
  submitJobPosting: vi.fn(),
}));

const returned: JobPosting = {
  jobPostId: 7,
  title: "Nurse Scheduler",
  description: "Plan shifts for 40 nurses.",
  jobRequirements: "Two years of scheduling.",
  location: "Hybrid",
  employmentType: "Full-time",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-11-20",
  applicationDeadline: "2026-12-20",
  postStatus: "RETURNED",
  organization: { organizationId: 2, name: "Waco Health Partners" },
  reviewComment: "Add the salary range.",
};

function open(posting: JobPosting = returned) {
  vi.mocked(openPostingForEdit).mockResolvedValue(posting);
  render(<PostingEditForm token="recruiter-token" postingId={7} />);
}

describe("PostingEditForm", () => {
  afterEach(() => {
    vi.mocked(openPostingForEdit).mockReset();
    vi.mocked(updatePosting).mockReset();
    vi.mocked(submitJobPosting).mockReset();
  });

  it("shows a Returned posting with the Administrator's comments and its details", async () => {
    open();

    expect(await screen.findByRole("heading", { name: "Nurse Scheduler" })).toBeInTheDocument();
    expect(screen.getByText("Returned posting")).toBeInTheDocument();
    expect(screen.getByText("Posting for Waco Health Partners")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Administrator's comments" })).toHaveTextContent(
      "Returned by the administrator. “Add the salary range.” Change the posting and submit it again.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Nurse Scheduler");
    expect(screen.getByLabelText("Location")).toHaveValue("Hybrid");
    expect(vi.mocked(openPostingForEdit)).toHaveBeenCalledWith("recruiter-token", 7);
  });

  it("calls a Draft a draft and shows no comments", async () => {
    open({ ...returned, postStatus: "DRAFT", reviewComment: null });

    expect(await screen.findByText("Draft posting")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Administrator's comments" })).not.toBeInTheDocument();
  });

  it("saves the changes as a draft", async () => {
    open();
    vi.mocked(updatePosting).mockResolvedValue({ ...returned, salaryRange: "52,000 USD" });

    fireEvent.change(await screen.findByLabelText("Salary range, optional"), { target: { value: "52,000 USD" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    expect(vi.mocked(updatePosting).mock.calls[0][2]).toMatchObject({ title: "Nurse Scheduler", salaryRange: "52,000 USD" });
    expect(vi.mocked(submitJobPosting)).not.toHaveBeenCalled();
  });

  it("saves and then submits the posting for approval", async () => {
    open();
    vi.mocked(updatePosting).mockResolvedValue(returned);
    vi.mocked(submitJobPosting).mockResolvedValue({ ...returned, postStatus: "PENDING_APPROVAL", reviewComment: null });

    fireEvent.click(await screen.findByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText(/Submitted for approval/)).toBeInTheDocument();
    expect(vi.mocked(updatePosting)).toHaveBeenCalledBefore(vi.mocked(submitJobPosting));
    expect(screen.queryByRole("form", { name: "Posting details" })).not.toBeInTheDocument();
  });

  it("shows a refusal under the field it names", async () => {
    open();
    vi.mocked(updatePosting).mockRejectedValue(
      new PostingRejected("The application deadline must be between 1 and 90 days away"),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText("The application deadline must be between 1 and 90 days away")).toBeInTheDocument();
    expect(screen.getByLabelText("Application deadline")).toHaveAttribute("aria-invalid", "true");
    expect(vi.mocked(submitJobPosting)).not.toHaveBeenCalled();
  });

  it("keeps saying the changes are saved when the submission is refused", async () => {
    open();
    vi.mocked(updatePosting).mockResolvedValue({ ...returned, title: "Nurse Scheduler II" });
    vi.mocked(submitJobPosting).mockRejectedValue(
      new PostingRejected("The application deadline must be between 1 and 90 days away"),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Submit for approval" }));

    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nurse Scheduler II" })).toBeInTheDocument();
    expect(screen.getByLabelText("Application deadline")).toHaveAttribute("aria-invalid", "true");
  });

  it("says why when the posting cannot be opened, for example another recruiter's", async () => {
    vi.mocked(openPostingForEdit).mockRejectedValue(
      new PostingRejected("Only the recruiter who created this posting can change it"),
    );
    render(<PostingEditForm token="recruiter-token" postingId={7} />);

    expect(await screen.findByText("Only the recruiter who created this posting can change it")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Posting details" })).not.toBeInTheDocument();
  });

  it("asks to log in again when the session has ended", async () => {
    vi.mocked(openPostingForEdit).mockRejectedValue(new SessionEnded());
    render(<PostingEditForm token="recruiter-token" postingId={7} />);

    await waitFor(() => expect(screen.getByText("Your session has ended")).toBeInTheDocument());
  });
});
