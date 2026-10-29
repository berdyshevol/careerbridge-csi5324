import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// The shell by role ("Navigation" in spec/ui-drafts.md), as Given / When / Then. The side column,
// the tiles and the dock repeat one list; only the one that fits the width is visible.
const visibleNavigation = 'nav[aria-label="Navigation"]:visible';

test("given a visitor, when they open the job board, then the header offers Log in and Register and there is no navigation", async ({ page }) => {
  await page.goto("/jobs");

  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register", exact: true })).toHaveAttribute("href", "/register");
  await expect(page.locator(visibleNavigation)).toHaveCount(0);
  await expect(page.getByRole("contentinfo").getByRole("link")).toHaveText(["About CareerBridge"]);
});

test("given a logged-in applicant, when they open the job board, then the navigation holds only the applicant's entries", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/jobs");

  const navigation = page.locator(visibleNavigation);
  await expect(navigation.getByRole("link")).toHaveCount(4);
  await expect(navigation.getByRole("link", { name: /Find jobs|Jobs/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Posting approvals")).toHaveCount(0);
});

test("given a logged-in administrator, when they open the approvals, then the navigation holds only the administrator's entries", async ({ page }) => {
  await logIn(page, ACCOUNTS.administrator, "/admin/postings");

  const navigation = page.locator(visibleNavigation);
  await expect(navigation.getByRole("link", { name: /Posting approvals|Postings/ })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: /Find jobs|Jobs/ })).toHaveCount(0);
});

test("given a logged-in recruiter, when they open the job board, then the navigation leads to their postings and not to the applicant's desk", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter, "/jobs");

  const navigation = page.locator(visibleNavigation);
  await expect(navigation.getByRole("link", { name: "Postings" })).toHaveAttribute("href", "/recruiter/postings/new");
  await expect(navigation.getByRole("link", { name: /Find jobs|Jobs/ })).toHaveCount(0);
});
