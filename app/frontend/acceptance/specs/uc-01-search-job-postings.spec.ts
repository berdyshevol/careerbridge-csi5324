// Acceptance specifications for UC-01 Search Job Postings, written from spec/ alone.
import { test } from "../dsl";
import {
  confirmAnsweredWithin,
  confirmDetails,
  confirmFailureReported,
  confirmFound,
  confirmFoundExactly,
  confirmMarkedAsApplied,
  confirmMessage,
  confirmNewestFirst,
  confirmNoApplicantData,
  confirmNoPostings,
  confirmNotFound,
  confirmSameAnswer,
} from "../dsl/expectations";

test.describe("UC-01 Search Job Postings", { tag: "@UC-01" }, () => {
  test.describe("the open postings of all organizations", () => {
    test(
      "a visitor who is not logged in sees the published postings of every organization",
      { tag: ["@FR-UC01.1", "@BR-1", "@BR-3"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", organization: "Brazos Analytics" });
        await employers.publishPosting({ title: "Nurse Scheduler", organization: "Waco Health Partners" });
        await employers.publishPosting({ title: "Fleet Planner", organization: "Lone Star Logistics" });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer", "Nurse Scheduler", "Fleet Planner");
      },
    );

    test(
      "each posting comes with its title, organization, location, employment type, deadline, description, requirements and openings",
      { tag: ["@FR-UC01.1"] },
      async ({ employers, jobBoard }) => {
        const posting = await employers.publishPosting({
          title: "Backend Developer",
          organization: "Waco Health Partners",
          description: "Build the services behind our patient portal.",
          jobRequirements: "Three years of Java and Spring.",
          location: "Hybrid",
          employmentType: "Contract",
          daysUntilDeadline: 30,
          numberOfOpenings: 3,
        });

        const answer = await jobBoard.search();

        confirmDetails(answer, posting);
      },
    );

    test(
      "the newest posting comes first",
      { tag: ["@FR-UC01.1"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst" });
        await employers.publishPosting({ title: "Product Designer" });

        const answer = await jobBoard.search();

        confirmNewestFirst(answer, ["Product Designer", "Data Analyst", "Backend Developer"]);
      },
    );

    // Question: is "newest" the publication date (UC-12 step 6) or the date the recruiter submitted
    // the posting? This body assumes the publication date.
    test.fixme(
      "a posting approved later comes first even if it was submitted earlier",
      { tag: ["@FR-UC01.1"] },
      async ({ employers, administrator, jobBoard }) => {
        await employers.submitPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Data Analyst" });
        await administrator.approvePosting("Data Analyst");
        await administrator.approvePosting("Backend Developer");

        const answer = await jobBoard.search();

        confirmNewestFirst(answer, ["Backend Developer", "Data Analyst"]);
      },
    );

    test(
      "applicants, recruiters and the Administrator see the same open postings as a visitor",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Data Analyst" });
        await employers.saveDraft({ title: "Product Designer" });

        for (const role of ["Visitor", "Applicant", "Recruiter", "Administrator"] as const) {
          const answer = await jobBoard.search({}, { as: role });

          confirmFound(answer, "Backend Developer");
          confirmNotFound(answer, "Data Analyst", "Product Designer");
        }
      },
    );

    test(
      "the answer reveals nothing about the applicants of a posting",
      { tag: ["@FR-UC01.1", "@BR-15"] },
      async ({ employers, applicants, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await applicants.applyTo("Backend Developer");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNoApplicantData(answer);
      },
    );

    test(
      "searching changes nothing, so the same search gives the same answer",
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst" });

        const first = await jobBoard.search();
        const second = await jobBoard.search();

        confirmSameAnswer(first, second);
      },
    );

    // Question: the Applicant's interest asks for "a clear sign of postings they have already
    // applied to", but no step, FR or contract mentions it. Is it part of the search answer, or only
    // of the screen (or not required at all)? This body assumes the answer carries it.
    test.fixme(
      "an applicant sees which postings they have already applied to",
      { tag: ["@FR-UC01.1"] },
      async ({ employers, applicants, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst" });
        const applicant = await applicants.applyTo("Backend Developer");

        const answer = await jobBoard.search({}, { as: applicant });

        confirmMarkedAsApplied(answer, "Backend Developer");
        confirmMarkedAsApplied(answer, "Data Analyst", false);
      },
    );
  });

  test.describe("only approved postings are public", () => {
    test(
      "a draft is not returned",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.saveDraft({ title: "Data Analyst" });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    test(
      "a posting waiting for approval is not returned",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Data Analyst" });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    test(
      "a posting the Administrator returned for changes is not returned",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, administrator, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Data Analyst" });
        await administrator.returnPosting("Data Analyst");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    test(
      "a posting the Administrator rejected is not returned",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, administrator, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Data Analyst" });
        await administrator.rejectPosting("Data Analyst");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    test(
      "a posting appears once the Administrator approves it",
      { tag: ["@FR-UC01.1", "@BR-9"] },
      async ({ employers, administrator, jobBoard }) => {
        await employers.submitPosting({ title: "Backend Developer" });
        confirmNotFound(await jobBoard.search(), "Backend Developer");

        await administrator.approvePosting("Backend Developer");

        confirmFound(await jobBoard.search(), "Backend Developer");
      },
    );
  });

  test.describe("closed postings leave the board", () => {
    // Not reachable through the public interface: the system's clock cannot be moved from outside,
    // and a posting cannot be submitted with a deadline earlier than tomorrow.
    test.fixme(
      "a posting is still returned on its application deadline day",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, calendar, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await calendar.reachDeadlineDayOf("Backend Developer");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
      },
    );

    // Not reachable through the public interface: the system's clock cannot be moved from outside,
    // and a posting cannot be submitted with a deadline earlier than tomorrow.
    test.fixme(
      "a posting whose deadline has passed and that has expired is not returned",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, calendar, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", daysUntilDeadline: 60 });
        await employers.publishPosting({ title: "Data Analyst", daysUntilDeadline: 1 });
        await calendar.passDeadlineOf("Data Analyst");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Question: the postconditions say only postings "before their deadline" are returned, but
    // NFR-UC13.5 lets a posting leave public listings up to 15 minutes later, at the next expiration
    // run. Is a posting past its deadline returned until that run? This body assumes it is not.
    test.fixme(
      "a posting whose deadline has passed is not returned even before the expiration run",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, calendar, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", daysUntilDeadline: 60 });
        await employers.publishPosting({ title: "Data Analyst", daysUntilDeadline: 1 });
        await calendar.passDeadlineOf("Data Analyst", { expirationRun: false });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Not reachable through the public interface: offers (UC-14, UC-15) are not built yet, so no
    // applicant can be hired and no posting filled.
    test.fixme(
      "a filled posting is not returned",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, calendar, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst", numberOfOpenings: 1 });
        await employers.fillPosting("Data Analyst");
        // UC-07 lets a filled posting take up to a minute to leave public listings.
        await calendar.letTimePass({ minutes: 1 });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Question: the postconditions say a filled posting is never returned, but UC-07's special
    // requirements allow it to stay in public listings for up to 1 minute after the acceptance that
    // filled it. Which one is the acceptance criterion? This body assumes the postconditions.
    test.fixme(
      "a filled posting is not returned right after the acceptance that filled it",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst", numberOfOpenings: 1 });
        await employers.fillPosting("Data Analyst");

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Not reachable through the public interface: offers (UC-14, UC-15) are not built yet, so no
    // applicant can be hired.
    test.fixme(
      "a posting with openings left after a hire is still returned",
      { tag: ["@FR-UC01.1", "@BR-10"] },
      async ({ employers, calendar, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", numberOfOpenings: 2 });
        await employers.hireApplicants("Backend Developer", 1);
        await calendar.letTimePass({ minutes: 1 });

        const answer = await jobBoard.search();

        confirmFound(answer, "Backend Developer");
      },
    );
  });

  test.describe("searching by criteria", () => {
    test(
      "a keyword finds the postings whose title contains it",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Data Analyst" });

        const answer = await jobBoard.search({ keywords: "Backend" });

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Question: which details does a keyword search look in? UC-01 and FR-UC01.2 say "keyword" only.
    // This body assumes the description is searched.
    test.fixme(
      "a keyword finds the postings whose description contains it",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({
          title: "Platform Engineer",
          description: "You will run our Kubernetes clusters.",
        });
        await employers.publishPosting({ title: "Data Analyst" });

        const answer = await jobBoard.search({ keywords: "Kubernetes" });

        confirmFound(answer, "Platform Engineer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Question: which details does a keyword search look in? This body assumes the requirements
    // are searched.
    test.fixme(
      "a keyword finds the postings whose requirements contain it",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({
          title: "Platform Engineer",
          jobRequirements: "Experience with Terraform.",
        });
        await employers.publishPosting({ title: "Data Analyst" });

        const answer = await jobBoard.search({ keywords: "Terraform" });

        confirmFound(answer, "Platform Engineer");
        confirmNotFound(answer, "Data Analyst");
      },
    );

    // Question: UC-01 step 1 speaks of "keywords". Must a posting contain all of them, any of them,
    // or the exact phrase? This body assumes all of them, in any order.
    test.fixme(
      "several keywords find only the postings that contain all of them",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.publishPosting({ title: "Frontend Developer" });
        await employers.publishPosting({ title: "Backend Analyst" });

        const answer = await jobBoard.search({ keywords: "Developer Backend" });

        confirmFoundExactly(answer, ["Backend Developer"]);
      },
    );

    test(
      "a location finds only the postings at that location",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Support Agent", location: "Remote" });
        await employers.publishPosting({ title: "Warehouse Lead", location: "On-site" });

        const answer = await jobBoard.search({ location: "Remote" });

        confirmFound(answer, "Support Agent");
        confirmNotFound(answer, "Warehouse Lead");
      },
    );

    // Question: the domain model says a location is On-site, Hybrid or Remote and the board filters
    // by these values, while UC-11 variation 3b stores a city, region and country as well. Can a
    // visitor search by place? This body assumes the city is a location criterion.
    test.fixme(
      "a city finds only the postings located in it",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({
          title: "Clinic Analyst",
          location: "On-site",
          place: { city: "Waco", region: "Texas", country: "United States" },
        });
        await employers.publishPosting({
          title: "Port Analyst",
          location: "On-site",
          place: { city: "Houston", region: "Texas", country: "United States" },
        });

        const answer = await jobBoard.search({ location: "Waco" });

        confirmFound(answer, "Clinic Analyst");
        confirmNotFound(answer, "Port Analyst");
      },
    );

    test(
      "an organization finds only that organization's postings",
      { tag: ["@FR-UC01.2", "@BR-1"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", organization: "Brazos Analytics" });
        await employers.publishPosting({ title: "Nurse Scheduler", organization: "Waco Health Partners" });

        const answer = await jobBoard.search({ organization: "Brazos Analytics" });

        confirmFound(answer, "Backend Developer");
        confirmNotFound(answer, "Nurse Scheduler");
      },
    );

    test(
      "an employment type finds only the postings of that type",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Summer Intern", employmentType: "Internship" });
        await employers.publishPosting({ title: "Backend Developer", employmentType: "Full-time" });

        const answer = await jobBoard.search({ employmentType: "Internship" });

        confirmFound(answer, "Summer Intern");
        confirmNotFound(answer, "Backend Developer");
      },
    );

    test(
      "criteria left blank do not narrow the search",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({
          title: "Backend Developer",
          organization: "Brazos Analytics",
          location: "Remote",
          employmentType: "Full-time",
        });
        await employers.publishPosting({
          title: "Nurse Scheduler",
          organization: "Waco Health Partners",
          location: "On-site",
          employmentType: "Internship",
        });

        const answer = await jobBoard.search({
          keywords: "",
          location: "",
          organization: "",
          employmentType: "",
        });

        confirmFound(answer, "Backend Developer", "Nurse Scheduler");
      },
    );

    test(
      "keyword, location, organization and employment type in one search must all match",
      { tag: ["@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        const matching = {
          organization: "Brazos Analytics",
          location: "Remote",
          employmentType: "Full-time",
        } as const;
        await employers.publishPosting({ title: "Backend Developer", ...matching });
        await employers.publishPosting({ title: "Data Analyst", ...matching });
        await employers.publishPosting({ title: "Platform Developer", ...matching, location: "On-site" });
        await employers.publishPosting({
          title: "Frontend Developer",
          ...matching,
          organization: "Waco Health Partners",
        });
        await employers.publishPosting({ title: "Developer Intern", ...matching, employmentType: "Internship" });

        const answer = await jobBoard.search({ keywords: "Developer", ...matching });

        confirmFoundExactly(answer, ["Backend Developer"]);
      },
    );

    test(
      "criteria never bring back a posting that is not open",
      { tag: ["@FR-UC01.2", "@BR-9"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });
        await employers.submitPosting({ title: "Backend Architect" });
        await employers.saveDraft({ title: "Backend Lead" });

        const answer = await jobBoard.search({ keywords: "Backend" });

        confirmFoundExactly(answer, ["Backend Developer"]);
      },
    );

    test(
      "the matching postings also come newest first",
      { tag: ["@FR-UC01.1", "@FR-UC01.2"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer", employmentType: "Contract" });
        await employers.publishPosting({ title: "Data Analyst", employmentType: "Contract" });

        const answer = await jobBoard.search({ employmentType: "Contract" });

        confirmNewestFirst(answer, ["Data Analyst", "Backend Developer"]);
      },
    );
  });

  test.describe("when nothing is returned", () => {
    test(
      "no posting matches the criteria, and the visitor can search again with other criteria",
      { tag: ["@FR-UC01.2", "@UC-01-2b"] },
      async ({ employers, jobBoard }) => {
        await employers.publishPosting({ title: "Backend Developer" });

        confirmNoPostings(await jobBoard.search({ keywords: jobBoard.uniqueKeyword() }));

        confirmFound(await jobBoard.search({ keywords: "Backend" }), "Backend Developer");
      },
    );

    // Question: is "No matching postings." part of the system's answer (SSD-01 and CO-01.1 name only
    // the postings) or text on the job board screen? This body assumes it comes with the answer.
    test.fixme(
      'no posting matches the criteria and the answer says "No matching postings."',
      { tag: ["@FR-UC01.2", "@UC-01-2b"] },
      async ({ jobBoard }) => {
        const answer = await jobBoard.search({ keywords: jobBoard.uniqueKeyword() });

        confirmNoPostings(answer);
        confirmMessage(answer, "No matching postings.");
      },
    );

    // Not reachable through the public interface: the board is shared with the other tests and the
    // sample postings during a run, and no operation closes postings on demand.
    test.fixme(
      "no posting is open and no criteria are given",
      { tag: ["@FR-UC01.2", "@UC-01-2a"] },
      async ({ jobBoard }) => {
        await jobBoard.haveNoOpenPostings();

        confirmNoPostings(await jobBoard.search());
      },
    );

    // Question: is "No open positions right now." part of the system's answer or text on the job
    // board screen? This body assumes it comes with the answer.
    test.fixme(
      'no posting is open and the answer says "No open positions right now."',
      { tag: ["@FR-UC01.2", "@UC-01-2a"] },
      async ({ jobBoard }) => {
        await jobBoard.haveNoOpenPostings();

        const answer = await jobBoard.search();

        confirmNoPostings(answer);
        confirmMessage(answer, "No open positions right now.");
      },
    );
  });

  // Not reachable through the public interface: nothing a visitor sends makes the search fail.
  test.fixme(
    "a failure is reported as a failure, not as no postings, and the same search can be retried",
    { tag: ["@UC-01-*a"] },
    async ({ employers, jobBoard }) => {
      await employers.publishPosting({ title: "Backend Developer" });
      await jobBoard.failNextSearch();

      confirmFailureReported(await jobBoard.search({ keywords: "Backend" }));

      confirmFound(await jobBoard.search({ keywords: "Backend" }), "Backend Developer");
    },
  );

  // Not reachable through the public interface: 10,000 published postings would stay on the board
  // that every other test of the run shares; it needs a system of its own.
  test.fixme(
    "with 10,000 open postings the results arrive within 2 seconds",
    { tag: ["@NFR-UC01.1"] },
    async ({ employers, jobBoard }) => {
      await jobBoard.holdOpenPostings(10_000);
      await employers.publishPosting({ title: "Backend Developer" });

      confirmAnsweredWithin(await jobBoard.search(), 2);
      confirmAnsweredWithin(await jobBoard.search({ keywords: "Backend" }), 2);
    },
  );
});
