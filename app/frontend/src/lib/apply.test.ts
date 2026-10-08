import type { JobPosting } from "./api";
import { checkApplication, submitApplication, type Desk } from "./apply";
import type { DeskApplication } from "./sampleDesk";

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
  resume: { fileName: "Jordan_Lee_Resume.pdf", uploadDate: "2026-09-30" },
};

describe("checkApplication (FR-UC04.3, FR-UC04.6, FR-UC04.7)", () => {
  it("allows an open posting the applicant has not applied to", () => {
    expect(checkApplication(posting(), desk)).toEqual({ kind: "ok" });
  });

  it("refuses a posting that is no longer open (extension 4a)", () => {
    expect(checkApplication(posting({ postStatus: "CLOSED" }), desk).kind).toBe("closed");
  });

  it("requires a resume on file (extension 2a)", () => {
    expect(checkApplication(posting(), { ...desk, resume: null }).kind).toBe("no-resume");
  });

  it("refuses a second application to the same posting, whatever its stage (extension 4c)", () => {
    const check = checkApplication(posting({ jobPostId: 3 }), desk);
    expect(check.kind).toBe("already-applied");
    if (check.kind === "already-applied") {
      expect(check.application.postingId).toBe(3);
    }
  });

  it("refuses a sixth active application and lists the five (extension 4b)", () => {
    const full: Desk = { ...desk, applications: [1, 3, 4, 5, 6].map(application) };
    const check = checkApplication(posting(), full);
    expect(check.kind).toBe("limit");
    if (check.kind === "limit") {
      expect(check.active).toHaveLength(5);
    }
  });
});

describe("submitApplication (FR-UC04.4)", () => {
  it("creates the application in the Applied stage and adds it to the desk", () => {
    const result = submitApplication(posting(), desk);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.application).toMatchObject({
        postingId: 2,
        title: "Data Analyst Intern",
        organizationName: "Waco Health Partners",
        applicationStatus: "Applied",
      });
      expect(result.desk.applications).toHaveLength(4);
      expect(desk.applications).toHaveLength(3); // the input is left alone
    }
  });

  it("changes nothing when a check fails", () => {
    const result = submitApplication(posting({ jobPostId: 3 }), desk);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.check.kind).toBe("already-applied");
    }
  });
});
