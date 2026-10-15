import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JobPosting } from "@/lib/api";
import type { Desk } from "@/lib/apply";
import ApplyForm from "./ApplyForm";

const posting: JobPosting = {
  jobPostId: 2,
  title: "Data Analyst Intern",
  description: "",
  jobRequirements: "",
  location: "On-site",
  employmentType: "Part-time",
  salaryRange: null,
  numberOfOpenings: 1,
  datePosted: "2026-10-01",
  applicationDeadline: "2999-12-31",
  postStatus: "PUBLISHED",
  organization: { organizationId: 2, name: "Waco Health Partners" },
};

const desk: Desk = {
  applications: [
    {
      applicationId: 1,
      postingId: 3,
      title: "Backend Developer",
      organizationName: "Brazos Analytics",
      location: "Remote",
      employmentType: "Full-time",
      applicationStatus: "Interview",
    },
  ],
  appliedPostingIds: [3, 7], // 7 was withdrawn
  resume: { fileName: "Jordan_Lee_Resume.pdf", fileType: "application/pdf", fileSize: 184_320, uploadDate: "2026-09-30" },
};

function backendAnswers(response: Partial<Response>) {
  const fetch = vi.fn().mockResolvedValue({ headers: new Headers(), ...response });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("ApplyForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the posting, the contact details, the resume and the slots in use (FR-UC04.1)", () => {
    render(<ApplyForm posting={posting} desk={desk} />);

    expect(screen.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByText("jordan.lee@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jordan_Lee_Resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("of 5 in use").previousSibling).toHaveTextContent("1");
  });

  it("submits only after the applicant acknowledges that it cannot be edited (FR-UC04.2)", async () => {
    const user = userEvent.setup();
    render(<ApplyForm posting={posting} desk={desk} />);

    const submit = screen.getByRole("button", { name: "Submit application" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/jobs/2");
  });

  it("confirms the submission with the backend's count and a link to tracking (FR-UC04.4, FR-UC04.5)", async () => {
    const fetch = backendAnswers({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ applicationId: 7, applicationStatus: "APPLIED", activeApplicationCount: 2 }),
    });
    const user = userEvent.setup();
    render(<ApplyForm posting={posting} desk={desk} />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Application submitted" })).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toContain("/api/postings/2/apply");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      resumeFileName: "Jordan_Lee_Resume.pdf",
      resumeFileType: "application/pdf",
      resumeFileSize: 184_320,
    });
    expect(screen.getByText(/2 of 5 active applications/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track application status" })).toHaveAttribute(
      "href",
      "/applications",
    );
  });

  it("shows the backend's refusal and stays on the form (ADR-0006, extensions 4a-4c)", async () => {
    backendAnswers({
      ok: false,
      status: 403,
      headers: new Headers({ "Content-Type": "text/plain;charset=UTF-8" }),
      text: () => Promise.resolve("Saving is switched off on the public site until users can log in."),
    });
    const user = userEvent.setup();
    render(<ApplyForm posting={posting} desk={desk} />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saving is switched off");
    expect(screen.queryByRole("heading", { name: "Application submitted" })).not.toBeInTheDocument();
  });

  it("refuses a posting whose earlier application has ended, since a posting is applied to once (A5)", () => {
    render(<ApplyForm posting={{ ...posting, jobPostId: 7 }} desk={desk} />);

    expect(screen.getByRole("status")).toHaveTextContent("You already applied to this posting; that application has ended.");
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });

  it("explains an earlier application to the same posting and offers no submit (extension 4c)", () => {
    render(<ApplyForm posting={{ ...posting, jobPostId: 3 }} desk={desk} />);

    expect(screen.getByRole("status")).toHaveTextContent("You already applied to this posting");
    expect(screen.getByRole("status")).toHaveTextContent("Interview");
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });

  it("asks for a resume first when none is on file (FR-UC04.6)", () => {
    render(<ApplyForm posting={posting} desk={{ ...desk, resume: null }} />);

    expect(screen.getByRole("status")).toHaveTextContent("A resume is required");
    expect(screen.getByRole("link", { name: "Upload a resume" })).toHaveAttribute("href", "/profile");
  });

  it("lists the active applications when the limit is reached (FR-UC04.7)", () => {
    const full: Desk = {
      ...desk,
      applications: [1, 3, 4, 5, 6].map((postingId) => ({
        ...desk.applications[0],
        applicationId: postingId,
        postingId,
        title: `Posting ${postingId}`,
      })),
    };
    render(<ApplyForm posting={posting} desk={full} />);

    expect(screen.getByRole("status")).toHaveTextContent("5 active applications");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });
});
