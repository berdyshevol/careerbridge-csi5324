import { test } from "../dsl";

// UC-01 Search Job Postings (spec/use-cases.md), FR-UC01.1 and FR-UC01.2 (spec/requirements.md),
// CO-01.1 searchPostings (spec/ssd-and-contracts.md).

test.describe("UC-01 Search Job Postings", { tag: "@UC-01" }, () => {
  test("a visitor who is not logged in receives an open posting with its details", {
    tag: ["@FR-UC01.1", "@BR-3"],
  }, async ({ employers, jobBoard }) => {
    await employers.publishPosting({
      title: "Backend Developer",
      organization: "Waco Health Partners",
      location: "Hybrid",
      employmentType: "Part-time",
      description: "Keep the patient portal running.",
      jobRequirements: "Java and SQL.",
      numberOfOpenings: 2,
    });

    await jobBoard.search();

    jobBoard.confirmShowsDetailsOf("Backend Developer");
  });
});
