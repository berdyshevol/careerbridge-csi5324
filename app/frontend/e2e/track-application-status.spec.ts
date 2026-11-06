import { expect, test } from "@playwright/test";

// UC-05 Track Application Status, against the sample applications in applications.csv.

test("an applicant views active applications, stage history and recorded interview details", async ({ page }) => {
  await page.goto("/applications");

  await expect(page.getByRole("heading", { level: 1, name: "Track application status" })).toBeVisible();
  await expect(page.getByText(/[345] of 5 active/)).toBeVisible();

  await expect(page.getByRole("button", { name: "IT Support Specialist" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Backend Developer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Junior Software Engineer" })).toBeVisible();

  await page.getByRole("button", { name: "Backend Developer" }).click();

  await expect(page.getByRole("heading", { level: 2, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pipeline stage history" })).toBeVisible();
  await expect(page.getByText("Video call · Video link sent by email")).toBeVisible();
  await expect(page.getByText("Internal recruiter notes")).toHaveCount(0);
});

test("filtering by closed applications shows only terminal applications", async ({ page }) => {
  await page.goto("/applications");

  await expect(page.getByRole("button", { name: "Backend Developer" })).toBeVisible();
  await page.getByRole("button", { name: /Closed \(0\)/ }).click();

  await expect(page.getByText("No applications match this filter.")).toBeVisible();
});
