import { expect, type APIRequestContext, type Page } from "@playwright/test";

// The demo accounts of the throw-away test database (app/backend/src/test/resources/config/application.properties)
export const ACCOUNTS = {
  applicant: { email: "jordan.lee@example.com", password: "Applicant-test-1", name: "Jordan Lee" },
  secondApplicant: { email: "sam.rivera@example.com", password: "Applicant-test-2", name: "Sam Rivera" },
  recruiter: { email: "riley.chen@example.com", password: "Recruiter-test-1", name: "Riley Chen" },
  administrator: { email: "admin@careerbridge.example", password: "Administrator-test-1", name: "Avery Morgan" },
};

export async function logIn(page: Page, account: { email: string; password: string }, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
}

// For tests that call the backend directly, as the frontend does after logging in
export async function tokenOf(request: APIRequestContext, account: { email: string; password: string }) {
  const answer = await request.post("http://localhost:8080/api/auth/login", {
    data: { email: account.email, password: account.password },
  });
  expect(answer.ok()).toBeTruthy();
  return { Authorization: `Bearer ${(await answer.json()).token}` };
}

// An account of its own, for a test that changes the profile or the resume: the demo applicants'
// details and resume are what the other tests expect. Registering logs in and lands on /profile.
export async function registerNewApplicant(page: Page, label: string, projectName: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Pat Kim");
  await page.getByLabel("Email").fill(`pat.${label}.${projectName}.${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("Sunrise-2026x");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
}
