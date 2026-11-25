import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, logIn, registerNewApplicant } from "./accounts";

// The final iteration's minimum scope, one check per item: Applicant A1–A9, Recruiter R1–R7,
// Administrator D1–D3. Each drives the UI against the real backend and database. An item that is not
// built yet is test.fixme with the ticket that builds it, so the report lists what is missing without
// turning CI red; whoever builds the item turns its check on (SCRUM-208).

const resume = path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf");

async function newApplicantWithResume(page: Page, label: string, projectName: string) {
  await registerNewApplicant(page, label, projectName);
  await page.getByLabel("Choose a file").setInputFiles(resume);
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
}

test.describe("Applicant", () => {
  test("A1 · given a visitor, when they register with an email and a password, then they have an account", async ({ page }, testInfo) => {
    await registerNewApplicant(page, "scope-a1", testInfo.project.name);
    await expect(page.getByLabel("Pat Kim, Applicant")).toBeVisible();
  });

  test("A2 · given an applicant account, when they log in, then they are logged in as the applicant", async ({ page }) => {
    await logIn(page, ACCOUNTS.applicant);
    await expect(page.getByLabel(`${ACCOUNTS.applicant.name}, Applicant`)).toBeVisible();
  });

  test("A3 · given an applicant, when they update their profile, then it is saved and shown again after a reload", async ({ page }, testInfo) => {
    await registerNewApplicant(page, "scope-a3", testInfo.project.name);
    await page.getByLabel("Headline").fill("Data analyst");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByRole("form", { name: "Details" }).getByRole("status")).toContainText("Profile saved.");

    await page.reload();
    await expect(page.getByLabel("Headline")).toHaveValue("Data analyst");
  });

  test("A4 · given open postings, when someone searches by keyword, then only matching open postings are listed", async ({ page }) => {
    await page.goto("/jobs?keyword=Backend");
    await expect(page.getByRole("link", { name: "Backend Developer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toHaveCount(0);
  });

  test("A5 · given an open posting, when someone opens it, then its details are shown", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("link", { name: "Backend Developer" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
    await expect(page.getByText("Java, Spring Boot, PostgreSQL")).toBeVisible();
  });

  test("A6 · given an applicant with a resume, when they apply to an open posting, then the application is submitted", async ({ page }, testInfo) => {
    await newApplicantWithResume(page, "scope-a6", testInfo.project.name);
    await page.goto("/jobs/1/apply");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  });

  // The resume is uploaded to the profile and a copy goes with each application (UC-03, UC-04, A6)
  test("A7 · given an applicant who uploads a resume, when they apply, then that resume goes with the application", async ({ page }, testInfo) => {
    await newApplicantWithResume(page, "scope-a7", testInfo.project.name);
    await page.goto("/jobs/1/apply");
    await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  });

  test("A8 · given an applicant with applications, when they open Applications, then each is listed with its current stage", async ({ page }) => {
    await logIn(page, ACCOUNTS.applicant, "/applications");
    await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
    await expect(page.getByText("Backend Developer")).toBeVisible();
    await expect(page.getByText("of 5 active")).toBeVisible();
  });

  test("A9 · given an active application, when the applicant withdraws it, then it is Withdrawn", async ({ page }, testInfo) => {
    await newApplicantWithResume(page, "scope-a9", testInfo.project.name);
    await page.goto("/jobs/1/apply");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Submit application" }).click();
    await page.getByRole("link", { name: "Track application status" }).click();
    await page.getByRole("link", { name: "View" }).click();

    await page.getByRole("button", { name: "Withdraw application" }).click();
    await page.getByRole("button", { name: "Withdraw, final" }).click();
    await expect(page.getByText(/Withdrawn on/i)).toBeVisible();
  });
});

test.describe("Recruiter", () => {
  test("R1 · given a recruiter account, when they log in, then they are logged in as the recruiter", async ({ page }) => {
    await logIn(page, ACCOUNTS.recruiter);
    await expect(page.getByLabel(`${ACCOUNTS.recruiter.name}, Recruiter`)).toBeVisible();
  });

  test("R2 · given a recruiter, when they create a posting with a title and a deadline, then it is submitted for approval", async ({ page }, testInfo) => {
    const title = `Scope Check Engineer ${testInfo.project.name} ${Date.now()}`;
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await logIn(page, ACCOUNTS.recruiter, "/recruiter/postings/new");
    await page.getByLabel("Job title").fill(title);
    await page.getByLabel("Application deadline").fill(deadline);
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByText("Submitted for administrator review!")).toBeVisible();
  });

  // SCRUM-195 (open as #110) lists them; editing is SCRUM-131 (UC-11), and the spec excludes editing a
  // published posting, so the team agrees an equivalent first
  test.fixme("R3 · given a recruiter, when they open Postings, then they see their organization's postings and can change one", async () => {});

  // No ticket yet: UC-13 closes postings only when the deadline passes, not by the recruiter's choice
  test.fixme("R4 · given a recruiter's published posting, when they close it, then it leaves the job board", async () => {});

  // SCRUM-196 (UC-14)
  test.fixme("R5 · given applications to a recruiter's posting, when they open it, then the applications are listed", async () => {});

  // SCRUM-196 (UC-14): the resume copy, the profile details and the stage history
  test.fixme("R6 · given an application, when the recruiter opens it, then they see the applicant's information", async () => {});

  // SCRUM-200 and SCRUM-202 (UC-14): advance or reject, and the applicant sees the new stage
  test.fixme("R7 · given an application, when the recruiter changes its stage, then the applicant sees the new stage", async () => {});
});

test.describe("Administrator", () => {
  test("D1 · given the administrator account, when they log in, then they are logged in as the administrator", async ({ page }) => {
    await logIn(page, ACCOUNTS.administrator);
    await expect(page.getByLabel(`${ACCOUNTS.administrator.name}, Administrator`)).toBeVisible();
  });

  // No use case and no ticket yet
  test.fixme("D2 · given registered users, when the administrator opens Users, then each user is listed with their role", async () => {});

  // UC-08 and UC-10, in the branch reagan/UC-08-09-10 without a pull request
  test.fixme("D3 · given a recruiter request, when the administrator approves it, then the recruiter can log in", async () => {});
});
