import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ACCOUNTS, logIn, logOut, tokenOf } from "../accounts";

// The protocol driver of the user scenarios (spec/user-scenarios): the only place that knows the
// screens, their wording and the backend's addresses. The DSL (dsl.ts) speaks the use cases'
// language and call this; when a screen changes, only this file does.

const API = "http://localhost:8080";
const PASSWORD = "Sunrise-2026x";
const OTHER_PASSWORD = "Another-Sunrise-2026x";
const WRONG_PASSWORD = "not-the-password-1";
const RESUME_PDF = path.join(__dirname, "..", "fixtures", "Pat_Kim_Resume.pdf");
const RESUME_NAME = path.basename(RESUME_PDF);

const ORGANIZATION = { id: 1, name: "Brazos Analytics" };
// Every recruiter acts for this one until memberships exist: the test backend's stand-in (SCRUM-198)
const RECRUITERS_ORGANIZATION = { id: 2, name: "Waco Health Partners" };
const POSTING_DETAILS = { location: "Hybrid", employmentType: "Contract", numberOfOpenings: 2 };

export type Person = { firstName: string; lastName: string; fullName: string; email: string; password: string };
export type Posting = { title: string; id: number; description: string; requirements: string };

const person = (firstName: string, lastName: string, email: string, password: string): Person => ({
  firstName,
  lastName,
  fullName: `${firstName} ${lastName}`,
  email,
  password,
});

const fromAccount = (account: { name: string; email: string; password: string }) => {
  const [firstName, lastName] = account.name.split(" ");
  return person(firstName, lastName, account.email, account.password);
};

export const ADMINISTRATOR = fromAccount(ACCOUNTS.administrator);

// One per scenario. Every alias gets this run's suffix, so a scenario never meets the data of another
// scenario or run; the demo recruiter and administrator are the only shared accounts.
export class Cast {
  private readonly run = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  private readonly people = new Map<string, Person>();
  private readonly postings = new Map<string, Posting>();
  private readonly tokens = new Map<string, Promise<{ Authorization: string }>>();
  readonly stranger = person("Nobody", "Known", `nobody.${this.run}@example.com`, WRONG_PASSWORD);
  lastKeyword = "";

  person(alias: string): Person {
    if (!this.people.has(alias)) {
      this.people.set(alias, person(alias, "Tester", `${alias.toLowerCase()}.${this.run}@example.com`, PASSWORD));
    }
    return this.people.get(alias)!;
  }

  // The system cannot create recruiters yet (UC-08), so a recruiter is the demo recruiter
  castAsDemoRecruiter(alias: string) {
    this.people.set(alias, fromAccount(ACCOUNTS.recruiter));
  }

  addPosting(alias: string, id: number): Posting {
    const posting = {
      title: `${alias} ${this.run}`,
      id,
      description: `What the ${alias} does all day.`,
      requirements: `What a ${alias} needs to know.`,
    };
    this.postings.set(alias, posting);
    return posting;
  }

  posting(alias: string): Posting {
    const posting = this.postings.get(alias);
    if (!posting) {
      throw new Error(`No posting "${alias}" was set up in a Given step`);
    }
    return posting;
  }

  postingTitle(alias: string) {
    return `${alias} ${this.run}`;
  }

  token(request: APIRequestContext, account: { email: string; password: string }) {
    if (!this.tokens.has(account.email)) {
      this.tokens.set(account.email, tokenOf(request, account));
    }
    return this.tokens.get(account.email)!;
  }
}

// Backend: setting up the Given and reading what the system kept

export async function registerByApi(request: APIRequestContext, applicant: Person) {
  const answer = await request.post(`${API}/api/applicants`, {
    data: { fullName: applicant.fullName, email: applicant.email, password: applicant.password },
  });
  expect(answer.ok(), await answer.text()).toBeTruthy();
}

export async function logInAccepted(request: APIRequestContext, email: string, password: string) {
  return (await request.post(`${API}/api/auth/login`, { data: { email, password } })).ok();
}

export async function hasOnlyItsOwnPassword(request: APIRequestContext, applicant: Person) {
  return (
    (await logInAccepted(request, applicant.email, applicant.password)) &&
    !(await logInAccepted(request, applicant.email, OTHER_PASSWORD))
  );
}

export async function failLogIns(request: APIRequestContext, applicant: Person, times: number) {
  for (let attempt = 0; attempt < times; attempt++) {
    expect(await logInAccepted(request, applicant.email, WRONG_PASSWORD)).toBeFalsy();
  }
}

export async function profileOf(request: APIRequestContext, cast: Cast, applicant: Person) {
  const answer = await request.get(`${API}/api/applicant/profile`, { headers: await cast.token(request, applicant) });
  expect(answer.ok()).toBeTruthy();
  return answer.json();
}

export async function setPhoneByApi(request: APIRequestContext, cast: Cast, applicant: Person, phone: string) {
  const answer = await request.put(`${API}/api/applicant/profile`, {
    headers: await cast.token(request, applicant),
    data: { firstName: applicant.firstName, lastName: applicant.lastName, phone },
  });
  expect(answer.ok(), await answer.text()).toBeTruthy();
}

// The demo recruiter submits a posting; the administrator approves it when it is to be open
export async function postingByApi(
  request: APIRequestContext,
  cast: Cast,
  alias: string,
  open: boolean,
  ofTheRecruitersOrganization = false,
) {
  const recruiter = await cast.token(request, ACCOUNTS.recruiter);
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const created = await request.post(`${API}/api/postings`, {
    headers: recruiter,
    data: {
      organizationId: (ofTheRecruitersOrganization ? RECRUITERS_ORGANIZATION : ORGANIZATION).id,
      title: cast.postingTitle(alias),
      description: `What the ${alias} does all day.`,
      jobRequirements: `What a ${alias} needs to know.`,
      ...POSTING_DETAILS,
      applicationDeadline: deadline,
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const posting = cast.addPosting(alias, (await created.json()).jobPostId);
  expect((await request.post(`${API}/api/postings/${posting.id}/submit`, { headers: recruiter })).ok()).toBeTruthy();
  if (open) {
    const administrator = await cast.token(request, ACCOUNTS.administrator);
    expect(
      (await request.post(`${API}/api/admin/postings/${posting.id}/approve`, { headers: administrator })).ok(),
    ).toBeTruthy();
  }
}

export async function applyByApi(request: APIRequestContext, cast: Cast, applicant: Person, posting: Posting) {
  await registerByApi(request, applicant);
  const headers = await cast.token(request, applicant);
  const resume = await request.post(`${API}/api/applicant/resume`, {
    headers,
    multipart: { file: { name: RESUME_NAME, mimeType: "application/pdf", buffer: readFileSync(RESUME_PDF) } },
  });
  expect(resume.ok(), await resume.text()).toBeTruthy();
  const applied = await request.post(`${API}/api/postings/${posting.id}/application`, { headers });
  expect(applied.ok(), await applied.text()).toBeTruthy();
}

export async function isWaitingForApproval(request: APIRequestContext, cast: Cast, posting: Posting) {
  const pending: { jobPostId: number }[] = await (
    await request.get(`${API}/api/admin/postings/pending`, { headers: await cast.token(request, ACCOUNTS.administrator) })
  ).json();
  return pending.some((each) => each.jobPostId === posting.id);
}

export async function openPostingsMatching(request: APIRequestContext, keyword: string) {
  return (await request.get(`${API}/api/postings?keyword=${encodeURIComponent(keyword)}`)).json();
}

// Screens: what a person sees and does

const accountMenu = (page: Page) => page.getByRole("button", { name: /^Account menu for / });
const refusal = (page: Page) => page.getByRole("main").getByRole("alert");
const navigation = (page: Page) => page.getByRole("navigation", { name: "Navigation" });
const keywords = (page: Page) => page.getByRole("main").getByRole("searchbox", { name: "Keywords" });

export async function arriveAsVisitor(page: Page) {
  await page.goto("/");
  await expectNobodyLoggedIn(page);
}

export async function expectNobodyLoggedIn(page: Page) {
  await expect(accountMenu(page)).toHaveCount(0);
}

async function fillRegistration(page: Page, fullName: string, email: string, password: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
}

export async function registerOnScreen(page: Page, applicant: Person) {
  await fillRegistration(page, applicant.fullName, applicant.email, applicant.password);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function registerWithOneWordNameAndWeakPassword(page: Page, applicant: Person) {
  await fillRegistration(page, applicant.firstName, applicant.email, "short");
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function registerWithTheEmailOf(page: Page, applicant: Person) {
  await fillRegistration(page, "Other Person", applicant.email, OTHER_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

// UC-02 extension 1a: the applicant form is filled in, then left for recruiter registration
export async function fillRegistrationThenChooseRecruiter(page: Page, applicant: Person) {
  await fillRegistration(page, applicant.fullName, applicant.email, applicant.password);
  await page.getByRole("link", { name: "Register your organization" }).click();
}

export async function expectOnRecruiterRegistration(page: Page) {
  await expect(page).toHaveURL(/\/recruiter\/register$/);
}

export async function expectInvitedToAddResume(page: Page) {
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("No resume on file.")).toBeVisible();
}

export async function expectRegistrationRefused(page: Page, reason: "last name" | "password policy" | "email taken") {
  if (reason === "last name") {
    await expect(page.getByText("Enter your first and last name.")).toBeVisible();
  } else if (reason === "password policy") {
    await expect(page.getByLabel("Password")).toHaveAccessibleDescription(
      "The password needs at least 10 characters, including a letter and a number.",
    );
  } else {
    await expect(page.getByLabel("Email")).toHaveAccessibleDescription(
      "An account already exists for this email. Log in instead",
    );
  }
  await expect(page).toHaveURL(/\/register/);
  await expectNobodyLoggedIn(page);
}

export async function expectOfferedToLogInInstead(page: Page) {
  await expect(page.getByRole("main").getByRole("link", { name: "Log in instead" })).toBeVisible();
}

export async function logInOnScreen(page: Page, account: Person) {
  await logIn(page, account);
}

// Leaves the form as the system answered, without waiting for a session
export async function tryToLogIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function tryWrongPassword(page: Page, account: Person) {
  await tryToLogIn(page, account.email, WRONG_PASSWORD);
}

export async function logOutOnScreen(page: Page) {
  await logOut(page);
  await expectNobodyLoggedIn(page);
}

export async function expectLoggedInAs(page: Page, account: Person, role: "Applicant" | "Recruiter" | "Administrator") {
  await expect(page.getByLabel(`${account.fullName}, ${role}`)).toBeVisible();
}

export async function expectLogInRefused(page: Page, reason: "credentials" | "locked") {
  await expect(refusal(page)).toHaveText(
    reason === "credentials"
      ? "The email or password is not right. Check both and try again."
      : "This account is locked. Five failed log-ins within 15 minutes lock it for 15 minutes.",
  );
  await expectNobodyLoggedIn(page);
}

export async function openApprovalQueue(page: Page) {
  await page.goto("/admin/postings");
}

export async function expectApprovalQueue(page: Page) {
  await openApprovalQueue(page);
  await expect(page.getByRole("heading", { name: "Pending review" })).toBeVisible();
}

export async function expectOnlyAdministratorNotice(page: Page) {
  await expect(page.getByText(/Only an administrator reviews postings/)).toBeVisible();
}

export async function expectPostingNotShown(page: Page, posting: Posting) {
  await expect(page.getByText(posting.title)).toHaveCount(0);
}

const APPLICANT_ENTRIES = ["Home", "Find jobs", "Applications", "Profile"];

export async function expectApplicantNavigation(page: Page) {
  await expect(navigation(page).getByRole("link")).toHaveText(APPLICANT_ENTRIES);
}

// Home is every role's; the rest is the applicant's own
export async function expectNoApplicantNavigation(page: Page) {
  await expect(navigation(page)).toBeVisible();
  for (const entry of APPLICANT_ENTRIES.slice(1)) {
    await expect(navigation(page).getByRole("link", { name: entry, exact: true })).toHaveCount(0);
  }
}

export async function expectCanCreatePosting(page: Page) {
  await page.goto("/recruiter/postings/new");
  await expect(page.getByRole("heading", { level: 1, name: "Create job posting" })).toBeVisible();
}

export async function expectCreatingPostingAsksToLogIn(page: Page) {
  await page.goto("/recruiter/postings/new");
  await expect(page.getByText("Log in as a recruiter to create a job posting.")).toBeVisible();
}

export async function openProfile(page: Page) {
  await page.goto("/profile");
}

export async function expectProfileOf(page: Page, applicant: Person) {
  await expect(page.getByLabel("First name")).toHaveValue(applicant.firstName);
  await expect(page.getByLabel("Last name")).toHaveValue(applicant.lastName);
  await expect(page.getByLabel("Email")).toHaveValue(applicant.email);
}

export async function expectNoResume(page: Page) {
  await expect(page.getByText("No resume on file.")).toBeVisible();
}

async function changeProfile(page: Page, label: string, value: string) {
  await openProfile(page);
  await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Save details" }).click();
}

export async function changeHeadline(page: Page, headline: string) {
  await changeProfile(page, "Headline", headline);
}

export async function changePhone(page: Page, phone: string) {
  await changeProfile(page, "Phone", phone);
}

export async function expectProfileSaved(page: Page) {
  await expect(page.getByRole("form", { name: "Details" }).getByRole("status")).toContainText("Profile saved.");
}

export async function expectPhoneRefused(page: Page) {
  await expect(page.getByText("Enter a phone number like (254) 555-0142.")).toBeVisible();
}

export async function uploadPdfResume(page: Page) {
  await openProfile(page);
  await page.getByLabel("Choose a file").setInputFiles(RESUME_PDF);
  await expectResumeOnFile(page);
}

export async function uploadPlainTextResume(page: Page, folder: string) {
  mkdirSync(folder, { recursive: true });
  const file = path.join(folder, "notes.txt");
  writeFileSync(file, "Not a resume.");
  await openProfile(page);
  await page.getByLabel("Choose a file").setInputFiles(file);
}

export async function expectResumeOnFile(page: Page, uploadedToday = false) {
  await expect(page.getByText(RESUME_NAME)).toBeVisible();
  if (uploadedToday) {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    await expect(page.getByText(`Uploaded ${today}`)).toBeVisible();
  }
}

export async function expectPlainTextResumeRefused(page: Page) {
  await expect(refusal(page)).toContainText("notes.txt was not uploaded.");
  await expect(refusal(page)).toContainText("Use a PDF or DOCX file of 5 MB or less.");
}

export async function search(page: Page, keyword: string) {
  await page.goto("/jobs");
  await keywords(page).fill(keyword);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(new RegExp(`keyword=${encodeURIComponent(keyword)}`));
}

export async function expectReturnedWithSummary(page: Page, posting: Posting) {
  const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: posting.title }) });
  await expect(card).toContainText(
    `${ORGANIZATION.name} · ${POSTING_DETAILS.location} · ${POSTING_DETAILS.employmentType}`,
  );
}

export async function expectNotReturned(page: Page, posting: Posting) {
  await expect(page.getByRole("link", { name: posting.title })).toHaveCount(0);
}

export async function expectNoMatch(page: Page) {
  await expect(page.getByText("No matching postings.")).toBeVisible();
}

export async function expectKeywordKept(page: Page, keyword: string) {
  await expect(keywords(page)).toHaveValue(keyword);
}

export async function openPosting(page: Page, posting: Posting) {
  await page.goto(`/jobs/${posting.id}`);
}

export async function expectPostingDetails(page: Page, posting: Posting) {
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: posting.title })).toBeVisible();
  for (const detail of [
    ORGANIZATION.name,
    POSTING_DETAILS.location,
    POSTING_DETAILS.employmentType,
    `${POSTING_DETAILS.numberOfOpenings} openings`,
    posting.description,
    posting.requirements,
  ]) {
    await expect(main.getByText(detail).first()).toBeVisible();
  }
}

// UC-14 Screen Applications

export async function openRecruiterPostings(page: Page) {
  await navigation(page).getByRole("link", { name: "Postings" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Postings" })).toBeVisible();
}

export async function expectApplicationsAtStage(page: Page, posting: Posting, count: number, stage: string) {
  // The count line reads "2 Applied, 1 Screening"
  const row = page.getByRole("listitem").filter({ hasText: posting.title });
  await expect(row.getByText(new RegExp(`(^|, )${count} ${stage}(,|$)`))).toBeVisible();
}
