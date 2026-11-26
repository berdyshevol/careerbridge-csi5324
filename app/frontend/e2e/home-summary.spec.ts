import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// ADR-0013: a role's home counts lists the role already sees, and each card leads to that list.
// The numbers are matched loosely: other tests change applications and queues in parallel.

test("given a logged-in applicant, when they open their home, then it counts their active applications and leads to them", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);
  await page.goto("/");

  const active = page.getByRole("link", { name: /^Active applications: \d of 5$/ });
  await expect(active).toBeVisible();
  await expect(page.getByRole("link", { name: /^Offers to answer: \d+$/ })).toBeVisible();

  await active.click();
  await expect(page).toHaveURL(/\/applications$/);
});

test("given a logged-in administrator, when they open their home, then it counts what waits for them", async ({ page }) => {
  await logIn(page, ACCOUNTS.administrator);
  await page.goto("/");

  await expect(page.getByRole("link", { name: /^Recruiter requests: \d+$/ })).toHaveAttribute("href", "/admin/requests");
  await expect(page.getByRole("link", { name: /^Users: \d+$/ })).toHaveAttribute("href", "/admin/users");
  await page.getByRole("link", { name: /^Postings to review: \d+$/ }).click();
  await expect(page).toHaveURL(/\/admin\/postings$/);
});
