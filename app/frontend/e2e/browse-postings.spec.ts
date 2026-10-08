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

test("searching narrows the list", async ({ page }) => {
  await page.goto("/jobs");

  await page.getByRole("main").getByRole("searchbox", { name: "Search job postings" }).fill("waco");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/keyword=waco/);
  await expect(page.getByRole("link", { name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Backend Developer" })).toHaveCount(0);
});

test("a posting opens with its details and a way to apply", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("link", { name: "Backend Developer" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByText("Java, Spring Boot, PostgreSQL")).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply" })).toBeVisible();
});

test("the desk shows recently published postings from the backend", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Recently published" })).toBeVisible();
  await expect(page.getByText("is not answering")).toHaveCount(0);
});
