import { expect, test } from "@playwright/test";

// UC-04 Apply for Job, against the sample postings in jobs.csv and the
// sample desk (three active applications, resume on file).

test("an applicant reviews, confirms and submits an application", async ({ page }) => {
  await page.goto("/jobs/2");
  await page.getByRole("link", { name: "Apply" }).click();

  await expect(page).toHaveURL(/\/jobs\/2\/apply$/);
  await expect(page.getByRole("heading", { level: 1, name: "Data Analyst Intern" })).toBeVisible();
  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toBeVisible();
  await expect(page.getByText("of 5 in use")).toBeVisible();

  const submit = page.getByRole("button", { name: "Submit application" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await submit.click();

  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  await expect(page.getByText("4 of 5 active applications")).toBeVisible();
  await expect(page.getByRole("link", { name: "Track application status" })).toBeVisible();
});

test("a posting already applied to cannot be applied to again", async ({ page }) => {
  await page.goto("/jobs/3/apply");

  await expect(page.getByRole("status")).toContainText("You already applied to this posting");
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);
});

test("cancelling returns to the posting without applying", async ({ page }) => {
  await page.goto("/jobs/2/apply");
  await page.getByRole("link", { name: "Cancel" }).click();

  await expect(page).toHaveURL(/\/jobs\/2$/);
  await expect(page.getByRole("link", { name: "Apply" })).toBeVisible();
});
