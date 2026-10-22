import { expect, test } from "@playwright/test";

// UC-01 Browse Job Postings, against the sample data in jobs.csv.

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
  await page.getByRole("link", { name: "All jobs" }).click();

  await expect(main.getByRole("combobox", { name: "Location" })).toHaveValue("On-site");
  await expect(page.getByRole("link", { name: "IT Support Specialist" })).toHaveCount(0);
});

test("the keyword finds postings by title", async ({ page }) => {
  await page.goto("/jobs");

  await page.getByRole("main").getByRole("searchbox", { name: "Search job postings" }).fill("analyst");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/jobs\?keyword=analyst$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Logistics Analyst" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("the organization filter finds postings by part of its name", async ({ page }) => {
  await page.goto("/jobs");

  await page.getByRole("main").getByRole("searchbox", { name: "Organization" }).fill("waco");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/jobs\?organization=waco$/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "IT Support Specialist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("criteria that match nothing say so and offer to clear the filters", async ({ page }) => {
  await page.goto("/jobs?organization=nobody");

  await expect(page.getByText("No matching postings.")).toBeVisible();
  await page.getByRole("link", { name: "Clear the filters" }).click();

  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByRole("link", { name: "Backend Developer" })).toBeVisible();
});

test("a posting opens with its details and a way to apply", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("link", { name: "Backend Developer" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByText("Java, Spring Boot, PostgreSQL")).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply" })).toBeVisible();
});

test("a closed posting still opens but no longer offers to apply", async ({ page }) => {
  // QA Engineer, the fifth row of jobs.csv, is Closed: an old link still reaches it (5a).
  await page.goto("/jobs/5");

  await expect(page.getByRole("heading", { level: 1, name: "QA Engineer" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("This posting is no longer accepting applications.");
  await expect(page.getByRole("link", { name: "Apply" })).toHaveCount(0);
});

test("the desk shows recently published postings from the backend", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recently published" })).toBeVisible();
  await expect(page.getByText("is not answering")).toHaveCount(0);
});
