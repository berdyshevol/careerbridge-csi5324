import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-11 and UC-12 together: a recruiter submits a posting, the administrator
// logs in (ADR-0010) and approves it, and it reaches the job board.

test("an approved posting appears on the job board", async ({ page }, testInfo) => {
  const title = `Approval Flow Engineer ${testInfo.project.name} ${Date.now()}`;
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/recruiter/postings/new");
  await page.getByLabel("Job title").fill(title);
  await page.getByLabel("Application deadline").fill(deadline);
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByText("Submitted for administrator review!")).toBeVisible();

  await logIn(page, ACCOUNTS.administrator, "/admin/postings");

  const posting = page.getByRole("article").filter({ hasText: title });
  await posting.getByRole("button", { name: "Approve & publish" }).click();
  await expect(page.getByRole("status")).toContainText("is approved and published");

  await page.goto(`/jobs?keyword=${encodeURIComponent(title)}`);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
