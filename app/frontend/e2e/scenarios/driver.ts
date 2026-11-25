import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ACCOUNTS } from "../accounts";

// The protocol driver of the user scenarios (spec/user-scenarios): the only place that knows the
// screens, their wording and the backend's addresses. The step definitions speak the use cases'
// language and call this; when a screen changes, only this file does.

const API = "http://localhost:8080";
export const PASSWORD = "Sunrise-2026x";
export const RESUME_PDF = `${__dirname}/../fixtures/Pat_Kim_Resume.pdf`;

export type Person = { alias: string; fullName: string; email: string; password: string };
export type Posting = { alias: string; title: string; id: number };

// Every alias gets this run's suffix, so a scenario never meets the data of another scenario or run
export class Cast {
  private readonly run = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  private readonly people = new Map<string, Person>();
  private readonly postings = new Map<string, Posting>();
  // A stand-in for an email address nobody has registered
  readonly strangerEmail = `nobody.${this.run}@example.com`;

  person(alias: string): Person {
    let person = this.people.get(alias);
    if (!person) {
      person = { alias, fullName: `${alias} Tester`, email: `${alias.toLowerCase()}.${this.run}@example.com`, password: PASSWORD };
      this.people.set(alias, person);
    }
    return person;
  }

  postingTitle(alias: string) {
    return `${alias} ${this.run}`;
  }

  remember(posting: Posting) {
    this.postings.set(posting.alias, posting);
  }

  posting(alias: string): Posting {
    const posting = this.postings.get(alias);
    if (!posting) {
      throw new Error(`No posting "${alias}" was set up in a Given step`);
    }
    return posting;
  }
}

// Backend calls, for setting up the Given and reading the system's state

export async function registerByApi(request: APIRequestContext, person: Person) {
  const answer = await request.post(`${API}/api/applicants`, {
    data: { fullName: person.fullName, email: person.email, password: person.password },
  });
  expect(answer.ok(), await answer.text()).toBeTruthy();
}

export async function logInByApi(request: APIRequestContext, email: string, password: string) {
  return request.post(`${API}/api/auth/login`, { data: { email, password } });
}

async function tokenOf(request: APIRequestContext, email: string, password: string) {
  const answer = await logInByApi(request, email, password);
  expect(answer.ok(), await answer.text()).toBeTruthy();
  return { Authorization: `Bearer ${(await answer.json()).token}` };
}

export async function profileOf(request: APIRequestContext, person: Person) {
  const answer = await request.get(`${API}/api/applicant/profile`, {
    headers: await tokenOf(request, person.email, person.password),
  });
  expect(answer.ok()).toBeTruthy();
  return answer.json();
}

export async function setPhoneByApi(request: APIRequestContext, person: Person, phone: string) {
  const [firstName, lastName] = person.fullName.split(" ");
  const answer = await request.put(`${API}/api/applicant/profile`, {
    headers: await tokenOf(request, person.email, person.password),
    data: { firstName, lastName, phone },
  });
  expect(answer.ok(), await answer.text()).toBeTruthy();
}

// The demo recruiter submits a posting; the demo administrator approves it when it is to be open
export async function postingByApi(request: APIRequestContext, cast: Cast, alias: string, open: boolean) {
  const recruiter = await tokenOf(request, ACCOUNTS.recruiter.email, ACCOUNTS.recruiter.password);
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const created = await request.post(`${API}/api/postings`, {
    headers: recruiter,
    data: {
      organizationId: 1,
      title: cast.postingTitle(alias),
      description: `What the ${alias} does all day.`,
      jobRequirements: `What a ${alias} needs to know.`,
      location: "Hybrid",
      employmentType: "Contract",
      numberOfOpenings: 2,
      applicationDeadline: deadline,
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const id: number = (await created.json()).jobPostId;
  expect((await request.post(`${API}/api/postings/${id}/submit`, { headers: recruiter })).ok()).toBeTruthy();
  if (open) {
    const administrator = await tokenOf(request, ACCOUNTS.administrator.email, ACCOUNTS.administrator.password);
    expect((await request.post(`${API}/api/admin/postings/${id}/approve`, { headers: administrator })).ok()).toBeTruthy();
  }
  cast.remember({ alias, title: cast.postingTitle(alias), id });
}

export async function isWaitingForApproval(request: APIRequestContext, posting: Posting) {
  const administrator = await tokenOf(request, ACCOUNTS.administrator.email, ACCOUNTS.administrator.password);
  const pending: { jobPostId: number }[] = await (
    await request.get(`${API}/api/admin/postings/pending`, { headers: administrator })
  ).json();
  return pending.some((each) => each.jobPostId === posting.id);
}

export async function openPostingsMatching(request: APIRequestContext, keyword: string) {
  return (await request.get(`${API}/api/postings?keyword=${encodeURIComponent(keyword)}`)).json();
}

// Screens

export const SCREEN = {
  wrongCredentials: "The email or password is not right. Check both and try again.",
  locked: "This account is locked. Five failed log-ins within 15 minutes lock it for 15 minutes.",
  lastNameNeeded: "Enter your first and last name.",
  passwordPolicy: "The password needs at least 10 characters, including a letter and a number.",
  emailTaken: "An account already exists for this email. Log in instead",
  phoneMalformed: "Enter a phone number like (254) 555-0142.",
  noResume: "No resume on file.",
  profileSaved: "Profile saved.",
  noMatch: "No matching postings.",
  resumeRefused: "Use a PDF or DOCX file of 5 MB or less.",
  onlyAdministrator: /Only an administrator reviews postings/,
  recruitersOnlyLogIn: "Log in as a recruiter to create a job posting.",
};

export async function fillRegistration(page: Page, fullName: string, email: string, password: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function submitLogIn(page: Page, email: string, password: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function logInOnScreen(page: Page, email: string, password: string) {
  await submitLogIn(page, email, password);
  await expect(page.getByRole("button", { name: /^Account menu for / })).toBeVisible();
}

export async function logOutOnScreen(page: Page) {
  await page.getByRole("button", { name: /^Account menu for / }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: /^Account menu for / })).toHaveCount(0);
}

export function signedInAs(page: Page, fullName: string, role: string) {
  return page.getByLabel(`${fullName}, ${role}`);
}

export function accountMenu(page: Page) {
  return page.getByRole("button", { name: /^Account menu for / });
}

export async function navigationEntries(page: Page) {
  return page.getByRole("navigation", { name: "Navigation" }).getByRole("link").allInnerTexts();
}

export async function searchJobBoard(page: Page, keyword: string) {
  await page.goto("/jobs");
  await page.getByRole("main").getByRole("searchbox", { name: "Keywords" }).fill(keyword);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(new RegExp(`keyword=${encodeURIComponent(keyword)}`));
}

export function postingCard(page: Page, title: string) {
  return page.getByRole("listitem").filter({ has: page.getByRole("link", { name: title }) });
}

export async function editProfileField(page: Page, label: string, value: string) {
  await page.goto("/profile");
  await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Save details" }).click();
}

export async function uploadResume(page: Page, file: string) {
  await page.goto("/profile");
  await page.getByLabel("Choose a file").setInputFiles(file);
}

export function today() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
