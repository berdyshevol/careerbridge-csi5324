import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// Log In (spec/use-cases.md, ADR-0010), as Given / When / Then

test("given a demo applicant, when they log in from the header, then the header shows them and they are back on the page", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("link", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fjobs/);

  await page.getByLabel("Email").fill(ACCOUNTS.applicant.email);
  await page.getByLabel("Password").fill(ACCOUNTS.applicant.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByLabel("Jordan Lee, Applicant")).toBeVisible();
});

test("given a wrong password, when someone logs in, then the backend's reason is shown and nobody is logged in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACCOUNTS.secondApplicant.email);
  await page.getByLabel("Password").fill("not-the-password-1");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText("The email or password is incorrect.");
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
});

test("given a logged-in recruiter, when they log out, then the header offers to log in again", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);
  await expect(page.getByLabel("Riley Chen, Recruiter")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
});

test("given a visitor on the approval page, when they log in as the administrator, then they come back to the queue", async ({ page }) => {
  await page.goto("/admin/postings");
  await page.getByRole("main").getByRole("link", { name: "Log in" }).click();

  await page.getByLabel("Email").fill(ACCOUNTS.administrator.email);
  await page.getByLabel("Password").fill(ACCOUNTS.administrator.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/admin\/postings$/);
  await expect(page.getByRole("heading", { name: "Pending review" })).toBeVisible();
});

test("given an applicant, when they open the approval page, then they are told only an administrator reviews postings", async ({ page }) => {
  await logIn(page, ACCOUNTS.secondApplicant);
  await page.goto("/admin/postings");
  await expect(page.getByText(/Only an administrator reviews postings/)).toBeVisible();
});

for (const account of [ACCOUNTS.recruiter, ACCOUNTS.administrator]) {
  test(`given ${account.name} logged in, when they open the home page, then nobody asks them to log in as an applicant`, async ({ page }) => {
    await logIn(page, account);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Recently published" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your applications" })).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Log in as an applicant" })).toHaveCount(0);
  });
}
