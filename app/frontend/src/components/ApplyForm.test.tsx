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
  resume: { fileName: "Jordan_Lee_Resume.pdf", uploadDate: "2026-09-30" },
};

describe("ApplyForm", () => {
  it("shows the posting, the contact details, the resume and the slots in use (FR-UC04.1)", () => {
    render(<ApplyForm posting={posting} initialDesk={desk} />);

    expect(screen.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByText("jordan.lee@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jordan_Lee_Resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("of 5 in use").previousSibling).toHaveTextContent("1");
  });

  it("submits only after the applicant acknowledges that it cannot be edited (FR-UC04.2)", async () => {
    const user = userEvent.setup();
    render(<ApplyForm posting={posting} initialDesk={desk} />);

    const submit = screen.getByRole("button", { name: "Submit application" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/jobs/2");
  });

  it("confirms the submission with the new count and a link to tracking (FR-UC04.4, FR-UC04.5)", async () => {
    const user = userEvent.setup();
    render(<ApplyForm posting={posting} initialDesk={desk} />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit application" }));

    expect(screen.getByRole("heading", { level: 1, name: "Application submitted" })).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 active applications/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track application status" })).toHaveAttribute(
      "href",
      "/applications",
    );
  });

  it("explains an earlier application to the same posting and offers no submit (extension 4c)", () => {
    render(<ApplyForm posting={{ ...posting, jobPostId: 3 }} initialDesk={desk} />);

    expect(screen.getByRole("status")).toHaveTextContent("You already applied to this posting");
    expect(screen.getByRole("status")).toHaveTextContent("Interview");
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });

  it("asks for a resume first when none is on file (FR-UC04.6)", () => {
    render(<ApplyForm posting={posting} initialDesk={{ ...desk, resume: null }} />);

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
    render(<ApplyForm posting={posting} initialDesk={full} />);

    expect(screen.getByRole("status")).toHaveTextContent("5 active applications");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "Submit application" })).not.toBeInTheDocument();
  });
});
