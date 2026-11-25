import { expect } from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";
import * as system from "./driver";
import { ADMINISTRATOR, Cast } from "./driver";

// The DSL of spec/user-scenarios/*.feature, its step definitions: each step says what happens in the words of the
// use cases and calls the driver, which alone knows the screens. Every scenario gets its own cast.

export const test = base.extend<{ cast: Cast }>({
  cast: async ({}, provide) => provide(new Cast()),
});

const { Given, When, Then } = createBdd(test);

// People

Given("a visitor {string} who is not logged in", async ({ page, cast }, alias: string) => {
  cast.person(alias);
  await system.arriveAsVisitor(page);
});

Given("an applicant {string} is registered", async ({ request, cast }, alias: string) => {
  await system.registerByApi(request, cast.person(alias));
});

Given("an applicant {string} is registered and logged in", async ({ page, request, cast }, alias: string) => {
  await system.registerByApi(request, cast.person(alias));
  await system.logInOnScreen(page, cast.person(alias));
});

Given(
  "an applicant {string} is registered with the phone number {string}",
  async ({ request, cast }, alias: string, phone: string) => {
    await system.registerByApi(request, cast.person(alias));
    await system.setPhoneByApi(request, cast, cast.person(alias), phone);
  },
);

Given("{string} is logged in", async ({ page, cast }, alias: string) => {
  await system.logInOnScreen(page, cast.person(alias));
});

Given("a recruiter {string} with an active account", async ({ cast }, alias: string) => {
  cast.castAsDemoRecruiter(alias);
});

// The administrator is set up with the system, not created by anyone
Given("the administrator", async () => {});

// Postings

Given("an open posting {string}", async ({ request, cast }, alias: string) => {
  await system.postingByApi(request, cast, alias, true);
});

Given("an open posting {string} of the organization {string} acts for", async ({ request, cast }, alias: string, _recruiter: string) => {
  await system.postingByApi(request, cast, alias, true, true);
});

Given("an open posting {string} of another organization", async ({ request, cast }, alias: string) => {
  await system.postingByApi(request, cast, alias, true);
});

Given(
  "a posting {string} of the organization {string} acts for, waiting for approval",
  async ({ request, cast }, alias: string, _recruiter: string) => {
    await system.postingByApi(request, cast, alias, false, true);
  },
);

Given("a posting {string} waiting for approval", async ({ request, cast }, alias: string) => {
  await system.postingByApi(request, cast, alias, false);
});

Given("no open posting mentions {string}", async ({ request }, keyword: string) => {
  expect(await system.openPostingsMatching(request, keyword)).toEqual([]);
});

// UC-02 Register as Applicant

When(
  "{string} registers as an applicant with a full name, a new email address and a password that meets the policy",
  async ({ page, cast }, alias: string) => {
    await system.registerOnScreen(page, cast.person(alias));
  },
);

When(
  "{string} registers as an applicant with a full name that has no last name and a password that does not meet the policy",
  async ({ page, cast }, alias: string) => {
    await system.registerWithOneWordNameAndWeakPassword(page, cast.person(alias));
  },
);

When("a visitor registers as an applicant with the email address of {string}", async ({ page, cast }, alias: string) => {
  await system.registerWithTheEmailOf(page, cast.person(alias));
});

When(
  "{string} fills in the applicant registration and then chooses a recruiter account instead",
  async ({ page, cast }, alias: string) => {
    await system.fillRegistrationThenChooseRecruiter(page, cast.person(alias));
  },
);

Then("{string} is invited to add a resume, with no resume on file", async ({ page }, _alias: string) => {
  await system.expectInvitedToAddResume(page);
});

Then("the registration is refused because the full name needs a last name", async ({ page }) => {
  await system.expectRegistrationRefused(page, "last name");
});

Then(
  "the registration is refused because the password needs at least 10 characters, including a letter and a number",
  async ({ page }) => {
    await system.expectRegistrationRefused(page, "password policy");
  },
);

Then("the registration is refused because an account already exists for that email", async ({ page }) => {
  await system.expectRegistrationRefused(page, "email taken");
});

Then("the visitor is offered to log in instead", async ({ page }) => {
  await system.expectOfferedToLogInInstead(page);
});

Then("{string} still has only the original account", async ({ request, cast }, alias: string) => {
  expect(await system.hasOnlyItsOwnPassword(request, cast.person(alias))).toBeTruthy();
});

// Registering that email now succeeds, which it would not if an account existed
Then(/^no (?:applicant )?account exists for "(.*)"$/, async ({ request, cast }, alias: string) => {
  await system.registerByApi(request, cast.person(alias));
});

Then("{string} is handed to registering a recruiter and an organization", async ({ page }, _alias: string) => {
  await system.expectOnRecruiterRegistration(page);
});

// Log In

When("{string} logs in", async ({ page, cast }, alias: string) => {
  await system.logInOnScreen(page, cast.person(alias));
});

When("the administrator logs in", async ({ page }) => {
  await system.logInOnScreen(page, ADMINISTRATOR);
});

When("{string} logs out and logs in again with that email address and password", async ({ page, cast }, alias: string) => {
  await system.logOutOnScreen(page);
  await system.logInOnScreen(page, cast.person(alias));
});

When("{string} logs out", async ({ page }, _alias: string) => {
  await system.logOutOnScreen(page);
});

When("someone logs in as {string} with a wrong password", async ({ page, cast }, alias: string) => {
  await system.tryWrongPassword(page, cast.person(alias));
});

When("someone logs in with an email address that has no account", async ({ page, cast }) => {
  await system.tryWrongPassword(page, cast.stranger);
});

When("someone fails to log in as {string} five times", async ({ request, cast }, alias: string) => {
  await system.failLogIns(request, cast.person(alias), 5);
});

When("{string} then logs in with the right password", async ({ page, cast }, alias: string) => {
  const applicant = cast.person(alias);
  await system.tryToLogIn(page, applicant.email, applicant.password);
});

Then("{string} is logged in as an applicant", async ({ page, cast }, alias: string) => {
  await system.expectLoggedInAs(page, cast.person(alias), "Applicant");
});

Then("{string} is logged in as a recruiter", async ({ page, cast }, alias: string) => {
  await system.expectLoggedInAs(page, cast.person(alias), "Recruiter");
});

Then("the administrator is logged in as the administrator", async ({ page }) => {
  await system.expectLoggedInAs(page, ADMINISTRATOR, "Administrator");
});

Then("the log-in is refused because the email or password is not right", async ({ page }) => {
  await system.expectLogInRefused(page, "credentials");
});

Then("the log-in is refused because the account is locked", async ({ page }) => {
  await system.expectLogInRefused(page, "locked");
});

Then("nobody is logged in", async ({ page }) => {
  await system.expectNobodyLoggedIn(page);
});

// What each role reaches

When("{string} asks to review the postings waiting for approval", async ({ page }, _alias: string) => {
  await system.openApprovalQueue(page);
});

Then("{string} is refused because only an administrator reviews postings", async ({ page }, _alias: string) => {
  await system.expectOnlyAdministratorNotice(page);
});

Then("{string} is not shown {string}", async ({ page, cast }, _alias: string, posting: string) => {
  await system.expectPostingNotShown(page, cast.posting(posting));
});

Then("{string} is still waiting for approval", async ({ request, cast }, posting: string) => {
  expect(await system.isWaitingForApproval(request, cast, cast.posting(posting))).toBeTruthy();
});

Then("{string} is offered only the applicant's own work", async ({ page }, _alias: string) => {
  await system.expectApplicantNavigation(page);
});

Then("{string} can create a job posting", async ({ page }, _alias: string) => {
  await system.expectCanCreatePosting(page);
});

Then("{string} is offered nothing of an applicant's work", async ({ page }, _alias: string) => {
  await system.expectNoApplicantNavigation(page);
});

Then("creating a job posting asks to log in first", async ({ page }) => {
  await system.expectCreatingPostingAsksToLogIn(page);
});

Then("the administrator can review the postings waiting for approval", async ({ page }) => {
  await system.expectApprovalQueue(page);
});

// UC-03 Update Applicant Profile

When("{string} views the profile", async ({ page }, _alias: string) => {
  await system.openProfile(page);
});

Then(
  "{string} sees the name and email address {string} registered with",
  async ({ page, cast }, alias: string, _registeredAs: string) => {
    await system.expectProfileOf(page, cast.person(alias));
  },
);

Then("{string} sees that no resume is on file", async ({ page }, _alias: string) => {
  await system.expectNoResume(page);
});

When("{string} changes the headline to {string}", async ({ page }, _alias: string, headline: string) => {
  await system.changeHeadline(page, headline);
});

When("{string} changes the phone number to {string}", async ({ page }, _alias: string, phone: string) => {
  await system.changePhone(page, phone);
});

Then("the profile details are saved", async ({ page }) => {
  await system.expectProfileSaved(page);
});

Then("the update is refused because the phone number is malformed", async ({ page }) => {
  await system.expectPhoneRefused(page);
});

Then("the profile of {string} has the headline {string}", async ({ request, cast }, alias: string, headline: string) => {
  expect((await system.profileOf(request, cast, cast.person(alias))).headline).toBe(headline);
});

Then("the profile of {string} has the phone number {string}", async ({ request, cast }, alias: string, phone: string) => {
  expect((await system.profileOf(request, cast, cast.person(alias))).phone).toBe(phone);
});

When(/^"(.*)" (?:uploads|has uploaded) a PDF resume$/, async ({ page }, _alias: string) => {
  await system.uploadPdfResume(page);
});

When("{string} uploads a plain-text file as the resume", async ({ page }, _alias: string) => {
  await system.uploadPlainTextResume(page, test.info().outputDir);
});

Then("the resume is on file with its file name and today's date", async ({ page }) => {
  await system.expectResumeOnFile(page, true);
});

Then("the resume is still on file when {string} views the profile again", async ({ page }, _alias: string) => {
  await system.openProfile(page);
  await system.expectResumeOnFile(page);
});

Then("the file is refused because only a PDF or DOCX of at most 5 MB is accepted", async ({ page }) => {
  await system.expectPlainTextResumeRefused(page);
});

Then("the PDF resume is still on file", async ({ page }) => {
  await system.expectResumeOnFile(page);
});

// UC-01 Search Job Postings

When("a visitor searches the open postings for {string}", async ({ page, cast }, keyword: string) => {
  cast.lastKeyword = keyword;
  await system.search(page, keyword);
});

When("a visitor views the details of {string}", async ({ page, cast }, posting: string) => {
  await system.openPosting(page, cast.posting(posting));
});

Then("{string} is returned with its organization, location and employment type", async ({ page, cast }, posting: string) => {
  await system.expectReturnedWithSummary(page, cast.posting(posting));
});

Then("{string} is not returned", async ({ page, cast }, posting: string) => {
  await system.expectNotReturned(page, cast.posting(posting));
});

Then("the visitor is told that no posting matches the criteria", async ({ page }) => {
  await system.expectNoMatch(page);
});

Then("the criteria are kept for another search", async ({ page, cast }) => {
  await system.expectKeywordKept(page, cast.lastKeyword);
});

Then(
  "the visitor sees the title, organization, location, employment type, openings, description and requirements of {string}",
  async ({ page, cast }, posting: string) => {
    await system.expectPostingDetails(page, cast.posting(posting));
  },
);

// Minimum scope Administrator 2: the users and their roles

When("the administrator views the users", async ({ page }) => {
  await system.openUsers(page);
});

When("{string} asks to see the users", async ({ page }, _alias: string) => {
  await system.openUsers(page);
});

Then("{string} is listed as an applicant", async ({ page, cast }, alias: string) => {
  await system.expectListedAs(page, cast.person(alias), "Applicant");
});

Then("{string} is listed as a recruiter", async ({ page, cast }, alias: string) => {
  await system.expectListedAs(page, cast.person(alias), "Recruiter");
});

Then("the administrator is listed as an administrator", async ({ page }) => {
  await system.expectListedAs(page, ADMINISTRATOR, "Administrator");
});

Then("{string} is refused because only an administrator sees the users", async ({ page }, _alias: string) => {
  await system.expectUsersRefused(page);
});

// UC-11 Create Job Posting

When("{string} saves the posting {string} as a draft", async ({ page, cast }, _alias: string, posting: string) => {
  await system.saveDraftOnScreen(page, cast, posting);
});

When("{string} submits it for approval", async ({ page }, _alias: string) => {
  await system.submitForApprovalOnScreen(page);
});

When(
  "{string} saves the posting {string} with a deadline more than 90 days away",
  async ({ page, cast }, _alias: string, posting: string) => {
    await system.saveDraftMoreThan90DaysAway(page, cast, posting);
  },
);

When("{string} saves a posting with no title", async ({ page }, _alias: string) => {
  await system.saveWithoutTitle(page);
});

Then("the posting is sent to the administrator for approval", async ({ page }) => {
  await system.expectSubmittedForApproval(page);
});

Then("the posting is kept as a draft", async ({ page }) => {
  await system.expectSavedAsDraft(page);
});

Then("the posting is refused because the title is missing", async ({ page }) => {
  await system.expectTitleRefused(page);
});

Then("no posting is saved", async ({ page }) => {
  await system.expectNothingSaved(page);
});

Then("the submission is refused because the deadline must be 1 to 90 days away", async ({ page }) => {
  await system.expectDeadlineRefused(page);
});

Then("{string} is waiting for approval", async ({ request, cast }, posting: string) => {
  expect(await system.isWaitingForApproval(request, cast, cast.posting(posting))).toBeTruthy();
});

Then("{string} is not waiting for approval", async ({ request, cast }, posting: string) => {
  expect(await system.isWaitingForApproval(request, cast, cast.posting(posting))).toBeFalsy();
});

Then("{string} is not on the job board", async ({ request, cast }, posting: string) => {
  expect(await system.isOnJobBoard(request, cast.posting(posting))).toBeFalsy();
});

// UC-12 Approve Job Posting

When("the administrator approves {string}", async ({ page, cast }, posting: string) => {
  await system.approveOnScreen(page, cast.posting(posting));
});

When(
  "the administrator returns {string} with the comment {string}",
  async ({ page, cast }, posting: string, comment: string) => {
    await system.returnOnScreen(page, cast.posting(posting), comment);
  },
);

When(
  "the administrator rejects {string} with the reason {string}",
  async ({ page, cast }, posting: string, reason: string) => {
    await system.rejectOnScreen(page, cast.posting(posting), reason);
  },
);

Then("the administrator is told {string} is published", async ({ page, cast }, posting: string) => {
  await system.expectDecision(page, cast.posting(posting), "published");
});

Then(
  "the administrator is told {string} is returned with the comment {string}",
  async ({ page, cast }, posting: string, comment: string) => {
    await system.expectDecision(page, cast.posting(posting), "returned", comment);
  },
);

Then("the administrator is told {string} is rejected", async ({ page, cast }, posting: string) => {
  await system.expectDecision(page, cast.posting(posting), "rejected");
});

Then("{string} is on the job board", async ({ request, cast }, posting: string) => {
  expect(await system.isOnJobBoard(request, cast.posting(posting))).toBeTruthy();
});

Then("{string} cannot be submitted again", async ({ request, cast }, posting: string) => {
  expect(await system.submitAgainByApi(request, cast, cast.posting(posting))).toBe(409);
});

// UC-14 Screen Applications

Given("an applicant {string} has applied to {string}", async ({ request, cast }, alias: string, posting: string) => {
  await system.applyByApi(request, cast, cast.person(alias), cast.posting(posting));
});

When("{string} asks to review the applications to the organization's postings", async ({ page }, _alias: string) => {
  await system.openRecruiterPostings(page);
});

Then(
  /^"(.*)" is shown with (\d+) applications? at (Applied|Screening|Interview|Offer)$/,
  async ({ page, cast }, posting: string, count: string, stage: string) => {
    await system.expectApplicationsAtStage(page, cast.posting(posting), Number(count), stage);
  },
);

Then("{string} is shown as waiting for approval", async ({ page, cast }, posting: string) => {
  await system.expectPostingStatus(page, cast.posting(posting), "waiting for approval");
});
