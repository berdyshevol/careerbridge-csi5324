import { test } from "../dsl";

// UC-01 Search Job Postings (spec/use-cases.md), FR-UC01.1 and FR-UC01.2 (spec/requirements.md),
// CO-01.1 searchPostings (spec/ssd-and-contracts.md), BR-n (spec/requirements.md section 3.3).
// A test.fixme is a scenario the specification leaves open or the public interface cannot reach;
// its comment says which, and the question goes to the use case's owner, not into the test.

test.describe("UC-01 Search Job Postings", { tag: "@UC-01" }, () => {
  test.describe("FR-UC01.1: any visitor views the open postings of all organizations, newest first, with their details", () => {
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

    test("a logged-in applicant receives the same open postings as a visitor", {
      tag: ["@FR-UC01.1"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer" });

      await jobBoard.searchLoggedInAsApplicant();

      jobBoard.confirmShows(["Backend Developer"]);
    });

    test("the open postings of every organization come back in one answer", {
      tag: ["@FR-UC01.1", "@BR-1"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Data Engineer", organization: "Brazos Analytics" });
      await employers.publishPosting({ title: "Nurse Practitioner", organization: "Waco Health Partners" });
      await employers.publishPosting({ title: "Fleet Planner", organization: "Lone Star Logistics" });

      await jobBoard.search();

      jobBoard.confirmShows(["Fleet Planner", "Nurse Practitioner", "Data Engineer"]);
    });

    test("the newest posting comes first", {
      tag: ["@FR-UC01.1"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Older Posting" });
      await employers.publishPosting({ title: "Newer Posting" });

      await jobBoard.search();

      jobBoard.confirmShows(["Newer Posting", "Older Posting"]);
    });

    // Open question: is "newest" the newest by creation or by publication? Here the posting
    // created first is published last. The code orders by the publication date (a day), then by
    // creation, so two postings published the same day come in creation order.
    test.fixme("the posting published last comes first, even when it was created first", {
      tag: ["@FR-UC01.1"],
    }, async ({ employers, jobBoard }) => {
      await employers.leavePosting("Pending Approval", { title: "Created First" });
      await employers.publishPosting({ title: "Created Second" });
      await employers.approvePosting("Created First");

      await jobBoard.search();

      jobBoard.confirmShows(["Created First", "Created Second"]);
    });
  });

  test.describe("BR-9: a job posting must be approved before it is published", () => {
    test("only approved postings are returned, never drafts or postings the Administrator has not approved", {
      tag: ["@BR-9", "@FR-UC01.1"],
    }, async ({ employers, jobBoard }) => {
      await employers.leavePosting("Draft", { title: "Draft Posting" });
      await employers.leavePosting("Pending Approval", { title: "Pending Posting" });
      await employers.leavePosting("Returned", { title: "Returned Posting" });
      await employers.leavePosting("Rejected", { title: "Rejected Posting" });
      await employers.publishPosting({ title: "Approved Posting" });

      await jobBoard.search();

      jobBoard.confirmShows(["Approved Posting"]);
    });
  });

  test.describe("BR-10: a posting closes when its deadline passes or when it is filled", () => {
    // Not reachable through the public interface: a posting cannot be created with a past
    // deadline, and the backend's clock cannot be moved from outside. e2e/expire-job-posting.spec.ts
    // covers it with a sample posting whose deadline has passed.
    test.fixme("a posting whose application deadline has passed is not returned", {
      tag: ["@BR-10"],
    }, async () => {});

    // Not reachable yet: filling a posting needs accepted offers (A2, UC-07), which have no
    // endpoint.
    test.fixme("a posting whose openings are all filled is not returned", {
      tag: ["@BR-10"],
    }, async () => {});
  });

  test.describe("FR-UC01.2: search by keyword, location, organization and employment type, in the same request", () => {
    test("a keyword finds the postings whose title contains it", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Kotlin Developer" });
      await employers.publishPosting({ title: "Data Analyst" });

      await jobBoard.search({ keyword: "Kotlin" });

      jobBoard.confirmShows(["Kotlin Developer"]);
    });

    // Open question: which details does a keyword look in (the title only, or also the description
    // and requirements), and when several keywords are given, must a posting contain all of them
    // or any? The code looks for the whole text, as one phrase, in the title, description and
    // requirements.
    test.fixme("a keyword also finds postings that mention it only in the description or requirements", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer", description: "Services written in Kotlin." });
      await employers.publishPosting({ title: "Mobile Developer", jobRequirements: "Kotlin and Swift." });
      await employers.publishPosting({ title: "Data Analyst" });

      await jobBoard.search({ keyword: "Kotlin" });

      jobBoard.confirmShows(["Mobile Developer", "Backend Developer"]);
    });

    test("a location returns only the postings at that location", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Lab Technician", location: "On-site" });
      await employers.publishPosting({ title: "Data Analyst", location: "Remote" });

      await jobBoard.search({ location: "On-site" });

      jobBoard.confirmShows(["Lab Technician"]);
    });

    test("an organization returns only that organization's postings", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Nurse Practitioner", organization: "Waco Health Partners" });
      await employers.publishPosting({ title: "Data Engineer", organization: "Brazos Analytics" });

      await jobBoard.search({ organization: "Waco Health Partners" });

      jobBoard.confirmShows(["Nurse Practitioner"]);
    });

    test("an employment type returns only the postings of that type", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Summer Intern", employmentType: "Internship" });
      await employers.publishPosting({ title: "Data Engineer", employmentType: "Full-time" });

      await jobBoard.search({ employmentType: "Internship" });

      jobBoard.confirmShows(["Summer Intern"]);
    });

    test("all four criteria in the same request return only the postings that meet every one", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      const match = { location: "On-site", organization: "Waco Health Partners", employmentType: "Part-time" };
      await employers.publishPosting({ title: "Kotlin Developer", ...match });
      await employers.publishPosting({ title: "Swift Developer", ...match });
      await employers.publishPosting({ title: "Kotlin Engineer", ...match, location: "Remote" });
      await employers.publishPosting({ title: "Kotlin Architect", ...match, organization: "Brazos Analytics" });
      await employers.publishPosting({ title: "Kotlin Intern", ...match, employmentType: "Internship" });

      await jobBoard.search({ keyword: "Kotlin", ...match });

      jobBoard.confirmShows(["Kotlin Developer"]);
    });

    test("criteria left blank do not narrow the search", {
      tag: ["@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer" });

      await jobBoard.search({ keyword: "", location: "", organization: "", employmentType: "" });

      jobBoard.confirmShows(["Backend Developer"]);
    });
  });

  test.describe("Extensions", () => {
    test("2b: criteria that no posting matches return no postings", {
      tag: ["@UC-01-2b", "@FR-UC01.2"],
    }, async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer", location: "Remote" });

      await jobBoard.search({ keyword: "Backend Developer", location: "On-site" });

      jobBoard.confirmNoMatches();
    });

    // Not reachable: the sample postings and the other tests share the database, so the board is
    // never empty during a run. The message "No open positions right now." is the screen's,
    // which the frontend's Vitest tests check.
    test.fixme("2a: with no open posting and no criteria, no postings are returned", {
      tag: ["@UC-01-2a"],
    }, async () => {});

    // Not reachable: the system cannot be made to fail through its public interface, and keeping
    // the visitor's criteria for a retry is the screen's behaviour.
    test.fixme("*a: when the system fails, the failure is reported and the visitor can retry", {
      tag: ["@UC-01-*a"],
    }, async () => {});
  });

  test.describe("Special requirements", () => {
    test("the job board reveals nothing about applicants or their applications", {
      tag: ["@BR-15"],
    }, async ({ employers, applicants, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer" });
      await applicants.apply({ name: "Morgan Quill", to: "Backend Developer" });

      await jobBoard.search();

      jobBoard.confirmShows(["Backend Developer"]);
      jobBoard.confirmRevealsNothingAbout("Morgan Quill");
    });

    // Not reachable through the public interface in a test's time: 10,000 open postings take
    // three requests each to publish. A load test with its own data set would check it.
    test.fixme("results come back within 2 seconds for up to 10,000 open postings", {
      tag: ["@NFR-UC01.1"],
    }, async () => {});
  });
});
