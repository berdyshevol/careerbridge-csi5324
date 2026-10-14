import { expect, test } from "@playwright/test";

// UC-11 and UC-12 together: a recruiter submits a posting, the local
// administrator (admin/admin, ADR-0007) approves it, and it reaches the job board.

test("an approved posting appears on the job board", async ({ page }, testInfo) => {
  const title = `Approval Flow Engineer ${testInfo.project.name} ${Date.now()}`;
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/recruiter/postings/new");
  await page.getByLabel("Job title").fill(title);
  await page.getByLabel("Application deadline").fill(deadline);
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByText("Submitted for administrator review!")).toBeVisible();

  await page.goto("/admin/postings");
  await page.getByLabel("Administrator username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Open approval dashboard" }).click();

  const posting = page.getByRole("article").filter({ hasText: title });
  await posting.getByRole("button", { name: "Approve & publish" }).click();
  await expect(page.getByRole("status")).toContainText("is approved and published");

  await page.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
