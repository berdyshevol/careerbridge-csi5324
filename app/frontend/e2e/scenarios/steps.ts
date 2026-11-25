import { writeFileSync } from "node:fs";
import { expect } from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";
import { ACCOUNTS } from "../accounts";
import {
  accountMenu,
  Cast,
  editProfileField,
  fillRegistration,
  isWaitingForApproval,
  logInByApi,
  logInOnScreen,
  logOutOnScreen,
  navigationEntries,
  openPostingsMatching,
  PASSWORD,
  postingByApi,
  postingCard,
  profileOf,
  registerByApi,
  RESUME_PDF,
  SCREEN,
  searchJobBoard,
  setPhoneByApi,
  signedInAs,
  submitLogIn,
  today,
  uploadResume,
} from "./driver";

// The vocabulary of spec/user-scenarios/*.feature: each step says what happens in the words of the
// use cases and leaves the screens to the driver. Every scenario gets its own cast of people and postings.

export const test = base.extend<{ cast: Cast }>({
  cast: async ({}, provide) => provide(new Cast()),
});

const { Given, When, Then } = createBdd(test);

const RECRUITER = "Riley";
const APPLICANT_ENTRIES = ["Home", "Find jobs", "Applications", "Profile"];

// People

Given("a visitor {string} who is not logged in", async ({ page, cast }, alias: string) => {
  cast.person(alias);
  await page.goto("/");
  await expect(accountMenu(page)).toHaveCount(0);
});

Given("an applicant {string} is registered", async ({ request, cast }, alias: string) => {
  await registerByApi(request, cast.person(alias));
});

Given("an applicant {string} is registered and logged in", async ({ page, request, cast }, alias: string) => {
  const person = cast.person(alias);
  await registerByApi(request, person);
  await logInOnScreen(page, person.email, person.password);
});

Given(
  "an applicant {string} is registered with the phone number {string}",
  async ({ request, cast }, alias: string, phone: string) => {
    const person = cast.person(alias);
    await registerByApi(request, person);
    await setPhoneByApi(request, person, phone);
  },
);

Given("{string} is logged in", async ({ page, cast }, alias: string) => {
  const person = cast.person(alias);
  await logInOnScreen(page, person.email, person.password);
});

// The system cannot create recruiters yet (UC-08), so Riley is the demo recruiter
Given("a recruiter {string} with an active account", async ({ cast }, alias: string) => {
  void cast;
  expect(alias).toBe(RECRUITER);
});

// The administrator is set up with the system, not created by anyone
Given("the administrator", async () => {});

// Postings

Given("an open posting {string}", async ({ request, cast }, alias: string) => {
  await postingByApi(request, cast, alias, true);
});

Given("a posting {string} waiting for approval", async ({ request, cast }, alias: string) => {
  await postingByApi(request, cast, alias, false);
});

Given("no open posting mentions {string}", async ({ request }, keyword: string) => {
  expect(await openPostingsMatching(request, keyword)).toEqual([]);
});

// UC-02 Register as Applicant

When(
  "{string} registers as an applicant with a full name, a new email address and a password that meets the policy",
  async ({ page, cast }, alias: string) => {
    const person = cast.person(alias);
    await fillRegistration(page, person.fullName, person.email, person.password);
  },
);

When(
  "{string} registers as an applicant with a full name that has no last name and a password that does not meet the policy",
  async ({ page, cast }, alias: string) => {
    await fillRegistration(page, alias, cast.person(alias).email, "short");
  },
);

When("a visitor registers as an applicant with the email address of {string}", async ({ page, cast }, alias: string) => {
  await fillRegistration(page, "Other Person", cast.person(alias).email, `Another-${PASSWORD}`);
});

When(
  "{string} starts to register as an applicant and chooses a recruiter account instead",
  async ({ page }, _alias: string) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Register your organization" }).click();
  },
);

Then("{string} is invited to add a resume, with no resume on file", async ({ page }, _alias: string) => {
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText(SCREEN.noResume)).toBeVisible();
});

Then("the registration is refused because the full name needs a last name", async ({ page }) => {
  await expect(page.getByText(SCREEN.lastNameNeeded)).toBeVisible();
});

Then(
  "the registration is refused because the password needs at least 10 characters, including a letter and a number",
  async ({ page }) => {
    await expect(page.getByLabel("Password")).toHaveAccessibleDescription(SCREEN.passwordPolicy);
    await expect(page).toHaveURL(/\/register/);
  },
);

Then("the registration is refused because an account already exists for that email", async ({ page }) => {
  await expect(page.getByLabel("Email")).toHaveAccessibleDescription(SCREEN.emailTaken);
  await expect(accountMenu(page)).toHaveCount(0);
});

Then("the visitor is offered to log in instead", async ({ page }) => {
  await expect(page.getByRole("main").getByRole("link", { name: "Log in instead" })).toBeVisible();
});

Then("{string} still has only the original account", async ({ request, cast }, alias: string) => {
  const person = cast.person(alias);
  expect((await logInByApi(request, person.email, `Another-${PASSWORD}`)).status()).toBe(401);
  expect((await logInByApi(request, person.email, person.password)).ok()).toBeTruthy();
});

// No account: registering that email now succeeds, which it would not if one existed
Then(/^no (?:applicant )?account exists for "(.*)"$/, async ({ request, cast }, alias: string) => {
  await registerByApi(request, cast.person(alias));
});

Then("{string} is handed to registering a recruiter and an organization", async ({ page }, _alias: string) => {
  await expect(page).toHaveURL(/\/recruiter\/register$/);
});

// Log In

When("{string} logs in", async ({ page, cast }, alias: string) => {
  if (alias === RECRUITER) {
    await logInOnScreen(page, ACCOUNTS.recruiter.email, ACCOUNTS.recruiter.password);
  } else {
    const person = cast.person(alias);
    await logInOnScreen(page, person.email, person.password);
  }
});

When("the administrator logs in", async ({ page }) => {
  await logInOnScreen(page, ACCOUNTS.administrator.email, ACCOUNTS.administrator.password);
});

When("{string} logs out and logs in again with that email address and password", async ({ page, cast }, alias: string) => {
  const person = cast.person(alias);
  await logOutOnScreen(page);
  await logInOnScreen(page, person.email, person.password);
});

When("{string} logs out", async ({ page }, _alias: string) => {
  await logOutOnScreen(page);
});

When("someone logs in as {string} with a wrong password", async ({ page, cast }, alias: string) => {
  await submitLogIn(page, cast.person(alias).email, "not-the-password-1");
});

When("someone logs in with an email address that has no account", async ({ page, cast }) => {
  await submitLogIn(page, cast.strangerEmail, "not-the-password-1");
});

When("someone fails to log in as {string} five times", async ({ request, cast }, alias: string) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    expect((await logInByApi(request, cast.person(alias).email, "not-the-password-1")).status()).toBe(401);
  }
});

When("{string} then logs in with the right password", async ({ page, cast }, alias: string) => {
  const person = cast.person(alias);
  await submitLogIn(page, person.email, person.password);
});

Then("{string} is logged in as an applicant", async ({ page, cast }, alias: string) => {
  await expect(signedInAs(page, cast.person(alias).fullName, "Applicant")).toBeVisible();
});

Then("{string} is logged in as a recruiter", async ({ page }, _alias: string) => {
  await expect(signedInAs(page, ACCOUNTS.recruiter.name, "Recruiter")).toBeVisible();
});

Then("the administrator is logged in as the administrator", async ({ page }) => {
  await expect(signedInAs(page, ACCOUNTS.administrator.name, "Administrator")).toBeVisible();
});

Then("the log-in is refused because the email or password is not right", async ({ page }) => {
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(SCREEN.wrongCredentials);
});

Then("the log-in is refused because the account is locked", async ({ page }) => {
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(SCREEN.locked);
});

Then("nobody is logged in", async ({ page }) => {
  await expect(accountMenu(page)).toHaveCount(0);
});

// What each role reaches

When("{string} asks to review the postings waiting for approval", async ({ page }, _alias: string) => {
  await page.goto("/admin/postings");
});

Then("{string} is refused because only an administrator reviews postings", async ({ page }, _alias: string) => {
  await expect(page.getByText(SCREEN.onlyAdministrator)).toBeVisible();
});

Then("{string} is not shown {string}", async ({ page, cast }, _alias: string, posting: string) => {
  await expect(page.getByText(cast.posting(posting).title)).toHaveCount(0);
});

Then("{string} is still waiting for approval", async ({ request, cast }, posting: string) => {
  expect(await isWaitingForApproval(request, cast.posting(posting))).toBeTruthy();
});

Then("{string} is offered only the applicant's own work", async ({ page }, _alias: string) => {
  expect(await navigationEntries(page)).toEqual(APPLICANT_ENTRIES);
});

Then("{string} can create a job posting", async ({ page }, _alias: string) => {
  await page.goto("/recruiter/postings/new");
  await expect(page.getByRole("heading", { level: 1, name: "Create job posting" })).toBeVisible();
});

Then("{string} is offered nothing of an applicant's work", async ({ page }, _alias: string) => {
  const entries = await navigationEntries(page);
  expect(entries).not.toContain("Applications");
  expect(entries).not.toContain("Profile");
});

Then("creating a job posting asks to log in first", async ({ page }) => {
  await page.goto("/recruiter/postings/new");
  await expect(page.getByText(SCREEN.recruitersOnlyLogIn)).toBeVisible();
});

Then("the administrator can review the postings waiting for approval", async ({ page }) => {
  await page.goto("/admin/postings");
  await expect(page.getByRole("heading", { name: "Pending review" })).toBeVisible();
});

// UC-03 Update Applicant Profile

When("{string} views the profile", async ({ page }, _alias: string) => {
  await page.goto("/profile");
});

Then("{string} sees the name and email address {string} registered with", async ({ page, cast }, alias: string, _registeredAs: string) => {
  const person = cast.person(alias);
  const [firstName, lastName] = person.fullName.split(" ");
  await expect(page.getByLabel("First name")).toHaveValue(firstName);
  await expect(page.getByLabel("Last name")).toHaveValue(lastName);
  await expect(page.getByLabel("Email")).toHaveValue(person.email);
});

Then("{string} sees that no resume is on file", async ({ page }, _alias: string) => {
  await expect(page.getByText(SCREEN.noResume)).toBeVisible();
});

When("{string} changes the headline to {string}", async ({ page }, _alias: string, headline: string) => {
  await editProfileField(page, "Headline", headline);
});

When("{string} changes the phone number to {string}", async ({ page }, _alias: string, phone: string) => {
  await editProfileField(page, "Phone", phone);
});

Then("the profile details are saved", async ({ page }) => {
  await expect(page.getByRole("form", { name: "Details" }).getByRole("status")).toContainText(SCREEN.profileSaved);
});

Then("the update is refused because the phone number is malformed", async ({ page }) => {
  await expect(page.getByText(SCREEN.phoneMalformed)).toBeVisible();
});

Then("the profile of {string} has the headline {string}", async ({ request, cast }, alias: string, headline: string) => {
  expect((await profileOf(request, cast.person(alias))).headline).toBe(headline);
});

Then("the profile of {string} has the phone number {string}", async ({ request, cast }, alias: string, phone: string) => {
  expect((await profileOf(request, cast.person(alias))).phone).toBe(phone);
});

When(/^"(.*)" (?:uploads|has uploaded) a PDF resume$/, async ({ page }, _alias: string) => {
  await uploadResume(page, RESUME_PDF);
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
});

When("{string} uploads a plain-text file as the resume", async ({ page }, _alias: string) => {
  const file = test.info().outputPath("notes.txt");
  writeFileSync(file, "Not a resume.");
  await uploadResume(page, file);
});

Then("the resume is on file with its file name and today's date", async ({ page }) => {
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
  await expect(page.getByText(`Uploaded ${today()}`)).toBeVisible();
});

Then("the resume is still on file when {string} views the profile again", async ({ page }, _alias: string) => {
  await page.reload();
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
});

Then("the file is refused because only a PDF or DOCX of at most 5 MB is accepted", async ({ page }) => {
  const refusal = page.getByRole("main").getByRole("alert");
  await expect(refusal).toContainText("notes.txt was not uploaded.");
  await expect(refusal).toContainText(SCREEN.resumeRefused);
});

Then("the PDF resume is still on file", async ({ page }) => {
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
});

// UC-01 Search Job Postings

When("a visitor searches the open postings for {string}", async ({ page }, keyword: string) => {
  await searchJobBoard(page, keyword);
});

When("a visitor views the details of {string}", async ({ page, cast }, posting: string) => {
  await page.goto(`/jobs/${cast.posting(posting).id}`);
});

Then(
  "{string} is returned with its organization, location and employment type",
  async ({ page, cast }, posting: string) => {
    await expect(postingCard(page, cast.posting(posting).title)).toContainText("Brazos Analytics · Hybrid · Contract");
  },
);

Then("{string} is not returned", async ({ page, cast }, posting: string) => {
  await expect(page.getByRole("link", { name: cast.posting(posting).title })).toHaveCount(0);
});

Then("the visitor is told that no posting matches the criteria", async ({ page }) => {
  await expect(page.getByText(SCREEN.noMatch)).toBeVisible();
});

Then("the criteria are kept for another search", async ({ page }) => {
  await expect(page.getByRole("main").getByRole("searchbox", { name: "Keywords" })).not.toHaveValue("");
});

Then(
  "the visitor sees the title, organization, location, employment type, openings, description and requirements of {string}",
  async ({ page, cast }, alias: string) => {
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: cast.posting(alias).title })).toBeVisible();
    for (const detail of ["Brazos Analytics", "Hybrid", "Contract", "2 openings", `What the ${alias} does all day.`, `What a ${alias} needs to know.`]) {
      await expect(main.getByText(detail, { exact: false }).first()).toBeVisible();
    }
  },
);

Then("no applicant data is shown", async ({ page }) => {
  await expect(page.getByRole("main")).not.toContainText("@");
});
