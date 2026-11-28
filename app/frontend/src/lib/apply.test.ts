import type { JobPosting } from "./api";
import { checkApplication, type Desk } from "./apply";
import type { DeskApplication } from "./api";

function posting(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
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
    closesAt: "3000-01-01T05:59:00Z",
    postStatus: "PUBLISHED",
    organization: { organizationId: 2, name: "Waco Health Partners" },
    ...overrides,
  };
}

function application(postingId: number): DeskApplication {
  return {
    applicationId: postingId,
    postingId,
    title: `Posting ${postingId}`,
    organizationName: "Brazos Analytics",
    location: "Remote",
    employmentType: "Full-time",
    applicationStatus: "Screening",
  };
}

const desk: Desk = {
  applications: [application(1), application(3), application(4)],
  refusal: null,
  applicationLimit: 5,
  resume: { fileName: "Jordan_Lee_Resume.pdf", uploadDate: "2026-09-30T14:00:00" },
};

// The backend names every refusal (SCRUM-266); the screen only shows it
describe("checkApplication (FR-UC04.3, FR-UC04.6, FR-UC04.7)", () => {
  it("allows the posting when the backend names no refusal", () => {
    expect(checkApplication(posting(), desk)).toEqual({ kind: "ok" });
  });

  it("does not decide a closed posting by itself (extension 1c)", () => {
    expect(checkApplication(posting({ postStatus: "CLOSED", closesAt: "2000-01-01T00:00:00Z" }), desk)).toEqual({ kind: "ok" });
    expect(checkApplication(posting(), { ...desk, refusal: "POSTING_CLOSED" }).kind).toBe("closed");
  });

  it("requires a resume on file (extension 2a)", () => {
    expect(checkApplication(posting(), { ...desk, refusal: "NO_RESUME" }).kind).toBe("no-resume");
  });

  it("refuses a second application to the same posting, whatever its stage (extension 4c)", () => {
    const check = checkApplication(posting({ jobPostId: 3 }), { ...desk, refusal: "ALREADY_APPLIED" });
    expect(check.kind).toBe("already-applied");
    if (check.kind === "already-applied") {
      expect(check.application?.postingId).toBe(3);
    }
  });

  it("refuses a posting whose earlier application has ended, such as a withdrawn one (A5)", () => {
    expect(checkApplication(posting({ jobPostId: 7 }), { ...desk, refusal: "ALREADY_APPLIED" })).toEqual({
      kind: "already-applied",
      application: undefined,
    });
  });

  it("refuses a sixth active application and lists the five (extension 4b)", () => {
    const full: Desk = { ...desk, applications: [1, 3, 4, 5, 6].map(application), refusal: "LIMIT_REACHED" };
    const check = checkApplication(posting(), full);
    expect(check.kind).toBe("limit");
    if (check.kind === "limit") {
      expect(check.active).toHaveLength(5);
      expect(check.limit).toBe(5);
    }
  });
});
