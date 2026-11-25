import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-14 steps 1-2: the recruiter opens the postings of the organization they act for and sees each
// posting with its applications at each stage. The test backend sets Waco Health Partners as that
// organization (STAND-IN, SCRUM-198).

test("a recruiter sees the postings of their organization with the applications at each stage", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);

  await page.getByRole("navigation", { name: "Navigation" }).getByRole("link", { name: "Postings" }).first().click();

  await expect(page.getByRole("heading", { name: "Postings" })).toBeVisible();
  await expect(page.getByText("Every posting of Waco Health Partners, with its status.")).toBeVisible();
  const itSupport = page.getByRole("listitem").filter({ hasText: "IT Support Specialist" });
  await expect(itSupport).toContainText("Published");
  await expect(itSupport).toContainText(/\d+ (Applied|Screening|Interview|Offer)/);
  // Another organization's posting never appears (BR-15)
  await expect(page.getByRole("listitem").filter({ hasText: "Backend Developer" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "New posting" })).toBeVisible();
});

test("an applicant is told that only a recruiter sees the postings", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/recruiter/postings");

  await expect(page.getByRole("heading", { name: "Recruiters only" })).toBeVisible();
});
