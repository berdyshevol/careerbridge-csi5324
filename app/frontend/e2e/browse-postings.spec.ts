import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-01 Search Job Postings, against the sample data in jobs.csv.

test("the job board lists only open postings", async ({ page }) => {
  await page.goto("/jobs");

  await expect(page.getByRole("heading", { name: "Open job postings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toBeVisible();
  // Closed, pending and draft postings from the sample file stay hidden.
  await expect(page.getByText("QA Engineer")).toHaveCount(0);
  await expect(page.getByText("Product Designer")).toHaveCount(0);
  await expect(page.getByText("Marketing Coordinator")).toHaveCount(0);
});

test("filters narrow the list and survive a visit to a posting", async ({ page }) => {
  await page.goto("/jobs");

  const main = page.getByRole("main");
  await main.getByRole("combobox", { name: "Location" }).selectOption("On-site");
  await main.getByRole("combobox", { name: "Employment type" }).selectOption("Internship");
  await page.getByRole("button", { name: "Search" }).click();

  // Only the chosen criteria stay in the address, not the keyword left empty
  await expect(page).toHaveURL(/\/jobs\?location=On-site&employmentType=Internship$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  // On-site but part-time, so the employment type alone hides it.
  await expect(page.getByRole("link", { name: "IT Support Specialist" })).toHaveCount(0);

  await page.getByRole("link", { name: "Data Analyst Intern" }).click();
  await page.getByRole("link", { name: "Back to results" }).click();

  await expect(main.getByRole("combobox", { name: "Location" })).toHaveValue("On-site");
  await expect(page.getByRole("link", { name: "IT Support Specialist" })).toHaveCount(0);
});

test("the keyword finds postings by title", async ({ page }) => {
  await page.goto("/jobs");

  await page.getByRole("main").getByRole("searchbox", { name: "Keywords" }).fill("analyst");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/jobs\?keyword=analyst$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Logistics Analyst" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("the organization is chosen from the organizations with open postings", async ({ page }) => {
  await page.goto("/jobs");

  await page.getByRole("main").getByRole("combobox", { name: "Organization" }).selectOption("Waco Health Partners");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/jobs\?organization=Waco\+Health\+Partners$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IT Support Specialist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("criteria that match nothing say so and stay in the form (2b)", async ({ page }) => {
  await page.goto("/jobs?keyword=astronaut");

  await expect(page.getByText("No matching postings.")).toBeVisible();
  await expect(page.getByRole("main").getByRole("searchbox", { name: "Keywords" })).toHaveValue("astronaut");
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("a posting opens with its details, and a visitor logs in to apply and comes back to it (UC-04 1a)", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("link", { name: "Backend Developer" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByText("Brazos Analytics")).toBeVisible();
  await expect(page.getByText("1 opening", { exact: true })).toBeVisible();
  await expect(page.getByText("Java, Spring Boot, PostgreSQL")).toBeVisible();
  await expect(page.getByRole("link", { name: "Register as an applicant" })).toBeVisible();

  await page.getByRole("link", { name: "Log in to apply" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fjobs%2F3$/);
  await page.getByLabel("Email").fill(ACCOUNTS.applicant.email);
  await page.getByLabel("Password").fill(ACCOUNTS.applicant.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/jobs\/3$/);
  await expect(page.getByRole("link", { name: "Apply", exact: true })).toHaveAttribute("href", "/jobs/3/apply");
});

test("a recruiter reading a posting is told only applicant accounts can apply (UC-04 1b)", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);
  await page.goto("/jobs/3");

  await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Only applicant accounts can apply.");
  await expect(page.getByRole("link", { name: "apply" })).toHaveCount(0);
});

test("a closed posting still opens but no longer offers to apply", async ({ page }) => {
  // QA Engineer, the fifth row of jobs.csv, is Closed: an old link still reaches it (5a).
  await page.goto("/jobs/5");

  await expect(page.getByRole("heading", { level: 1, name: "QA Engineer" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("This posting is no longer accepting applications.");
  // Neither Apply nor Log in to apply
  await expect(page.getByRole("link", { name: "apply" })).toHaveCount(0);
});

// The front page and the applicant's home (visitor-home, applicant-home), as Given / When / Then

test("given a visitor on the front page, when they search by keyword and location, then the job board shows the matches", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Find a job and apply." })).toBeVisible();

  const search = page.getByRole("form", { name: "Search job postings" });
  await search.getByRole("searchbox", { name: "Keywords" }).fill("analyst");
  await search.getByRole("combobox", { name: "Location" }).selectOption("On-site");
  await search.getByRole("button", { name: "Search jobs" }).click();

  await expect(page).toHaveURL(/\/jobs\?keyword=analyst&location=On-site$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("given a visitor on the front page, when they look for a way in, then it leads applicants and employers to register", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Register your organization" })).toHaveAttribute("href", "/recruiter/register");
  await page.getByRole("link", { name: "Register as an applicant" }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test("given a logged-in applicant, when they open the home page, then Find jobs leads to the job board", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/");
  await expect(page.getByRole("heading", { level: 1, name: "Welcome" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open applications" })).toHaveAttribute("href", "/applications");
  await expect(page.getByRole("link", { name: "Open profile" })).toHaveAttribute("href", "/profile");

  await page.getByRole("main").getByRole("link", { name: "Find jobs" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByRole("heading", { name: "Open job postings" })).toBeVisible();
});
