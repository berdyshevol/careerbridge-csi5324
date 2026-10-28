import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, registerNewApplicant, tokenOf } from "./accounts";

// UC-04 Apply for Job, against the sample postings in jobs.csv and the demo
// applicant Jordan Lee (three active applications and a resume on file, from SampleDataLoader).

// The application is saved, and a posting takes one application from the
// sample applicant, so each device applies to a posting of its own.
const postingFor = { laptop: { id: 2, title: "Data Analyst Intern" }, phone: { id: 8, title: "Logistics Analyst" } };

test("an applicant can cancel, then reviews, confirms and submits an application", async ({ page }, testInfo) => {
  const posting = postingFor[testInfo.project.name as keyof typeof postingFor];
  await logIn(page, ACCOUNTS.applicant);
  await page.goto(`/jobs/${posting.id}`);
  await page.getByRole("link", { name: "Apply" }).click();

  await expect(page).toHaveURL(new RegExp(`/jobs/${posting.id}/apply$`));
  await expect(page.getByRole("heading", { level: 1, name: posting.title })).toBeVisible();

  // Cancelling is part of this flow: once an application is saved, the form for
  // its posting is gone, so a spec of its own could not rely on finding it.
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${posting.id}$`));
  await page.getByRole("link", { name: "Apply" }).click();

  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toBeVisible();
  await expect(page.getByText(ACCOUNTS.applicant.email)).toBeVisible();
  await expect(page.getByText("of 5 in use")).toBeVisible();

  const submit = page.getByRole("button", { name: "Submit application" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await submit.click();

  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  // 4 of 5, or 5 of 5 when the other device has applied first
  await expect(page.getByText(/[45] of 5 active applications/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Track application status" })).toBeVisible();
});

// Extension 2a and FR-UC03.3: the resume that goes with the application is the one on file
test("given a new applicant without a resume, when they apply, then they are sent to upload one and can apply after", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "apply", testInfo.project.name);

  await page.goto("/jobs/1/apply");
  await expect(page.getByRole("status")).toContainText("A resume is required to apply");
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);

  await page.getByRole("link", { name: "Upload one in Profile & resume" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel("Choose your resume").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await page.getByRole("button", { name: "Upload resume" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Resume uploaded" })).toBeVisible();

  await page.goto("/jobs/1/apply");
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  await expect(page.getByText(/1 of 5 active applications/)).toBeVisible();
});

test("a posting already applied to cannot be applied to again", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);
  await page.goto("/jobs/3/apply");

  await expect(page.getByRole("status")).toContainText("You already applied to this posting");
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);
});

test("the desk counts the same applications as the backend", async ({ page, request }) => {
  const headers = await tokenOf(request, ACCOUNTS.applicant);
  await logIn(page, ACCOUNTS.applicant);
  // Retried: the other device may submit an application between the two reads
  await expect(async () => {
    const applications: { applicationStatus: string }[] = await (
      await request.get("http://localhost:8080/api/applicant/applications", { headers })
    ).json();
    const active = applications.filter((a) =>
      ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"].includes(a.applicationStatus),
    ).length;

    await page.goto("/");

    await expect(page.getByText(`${active} of 5 active`, { exact: true })).toBeVisible({ timeout: 2000 });
  }).toPass();
});

// UC-01 extensions 6a and 6c, as Given / When / Then

test("given a visitor, when they ask to apply, then they log in and come back to the form", async ({ page }) => {
  await page.goto("/jobs/2/apply");
  await expect(page.getByRole("heading", { name: "Log in to apply" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New here? Register as an applicant" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(ACCOUNTS.secondApplicant.email);
  await page.getByLabel("Password").fill(ACCOUNTS.secondApplicant.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/jobs\/2\/apply$/);
  await expect(page.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByText(ACCOUNTS.secondApplicant.email)).toBeVisible();
});

test("given a recruiter, when they ask to apply, then they are told only applicants apply", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);
  await page.goto("/jobs/2/apply");
  await expect(page.getByRole("heading", { name: "Only applicants apply" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);
});

test("given no log-in, when someone posts an application to the backend, then it is refused", async ({ request }) => {
  const response = await request.post("http://localhost:8080/api/postings/2/application");
  expect(response.status()).toBe(401);
});
