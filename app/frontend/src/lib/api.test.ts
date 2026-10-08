import { formatDate, isOpen, type JobPosting } from "./api";

function posting(overrides: Partial<JobPosting>): JobPosting {
  return {
    jobPostId: 1,
    title: "Backend Developer",
    description: "",
    jobRequirements: "",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: null,
    numberOfOpenings: 1,
    datePosted: "2026-10-05",
    applicationDeadline: "2999-12-31",
    postStatus: "PUBLISHED",
    organization: { organizationId: 1, name: "Brazos Analytics" },
    ...overrides,
  };
}

describe("isOpen", () => {
  it("is true for a published posting before its deadline", () => {
    expect(isOpen(posting({}))).toBe(true);
  });

  it("is false once the deadline has passed", () => {
    expect(isOpen(posting({ applicationDeadline: "2000-01-01" }))).toBe(false);
  });

  it("is false for a closed posting", () => {
    expect(isOpen(posting({ postStatus: "CLOSED" }))).toBe(false);
  });
});

describe("formatDate", () => {
  it("shows the calendar day that was stored, whatever the time zone", () => {
    expect(formatDate("2026-12-20")).toBe("Dec 20, 2026");
  });
});
