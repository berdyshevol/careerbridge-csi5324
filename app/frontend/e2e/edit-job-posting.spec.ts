import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, logOut } from "./accounts";

// UC-11 extensions 3b and 6a: the recruiter reopens their draft and changes it, the administrator
// returns it with a comment, and the recruiter revises the Returned posting and submits it again.

test("a recruiter edits a draft, and revises it after the administrator returns it", async ({ page }, testInfo) => {
  const title = `Edit Flow Engineer ${testInfo.project.name} ${Date.now()}`;
  const revised = `${title} revised`;
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await logIn(page, ACCOUNTS.recruiter);
  await page.goto("/recruiter/postings/new");
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Application deadline").fill(deadline);
  await page.getByRole("button", { name: "Save draft" }).click();

  // Extension 3b: the saved draft is reopened and changed
  await page.getByRole("link", { name: "Edit draft" }).click();
  await expect(page.getByText("Draft posting")).toBeVisible();
  await page.getByLabel("Openings").fill("2");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();
  const editAddress = page.url();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByText(/Submitted for approval/)).toBeVisible();

  await logOut(page);
  await logIn(page, ACCOUNTS.administrator, "/admin/postings");
  const pending = page.getByRole("article").filter({ hasText: title });
  await pending.getByLabel("Administrator review comment").fill("Add the salary range.");
  await pending.getByRole("button", { name: "Return for corrections" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  // Extension 6a: the Returned posting shows the comment, is revised and goes back to the queue
  await logOut(page);
  await logIn(page, ACCOUNTS.recruiter, new URL(editAddress).pathname);
  await expect(page.getByText("Returned posting")).toBeVisible();
  await expect(page.getByRole("status", { name: "Administrator's comments" })).toContainText("Add the salary range.");
  await expect(page.getByLabel("Openings")).toHaveValue("2");
  await page.getByLabel("Title", { exact: true }).fill(revised);
  await page.getByLabel("Salary range, optional").fill("52,000 - 60,000 USD per year");
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByText(/Submitted for approval/)).toBeVisible();

  await logOut(page);
  await logIn(page, ACCOUNTS.administrator, "/admin/postings");
  await expect(page.getByRole("article").filter({ hasText: revised })).toBeVisible();
});

test("a posting the recruiter did not create cannot be edited", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);
  // Sample posting 9 (jobs.csv) was created by no recruiter
  await page.goto("/recruiter/postings/9/edit");

  await expect(page.getByText("Only the recruiter who created this posting can change it")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
});
