import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-03 Update Applicant Profile, CO-03.1 and CO-03.2 (spec/use-cases.md), as Given / When / Then

test("given a logged-in applicant, when they open their profile, then it shows their own details from the backend", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Profile & resume" })).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Jordan");
  await expect(page.getByLabel("Last name")).toHaveValue("Lee");
  await expect(page.getByLabel("Email address")).toHaveValue(ACCOUNTS.applicant.email);
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0142");
  // The demo applicant starts without a resume: nothing uploads one until SCRUM-163
  await expect(page.getByText(/No resume on file yet/)).toBeVisible();
  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toHaveCount(0);
});

test("given a new applicant, when they change their phone and headline and save, then both are still there after a reload", async ({ page }, testInfo) => {
  // An account of its own: the demo applicant's details are what the other tests expect
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Pat Kim");
  await page.getByLabel("Email").fill(`pat.profile.${testInfo.project.name}.${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("Sunrise-2026x");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByLabel("Phone number").fill("(254) 555-0199");
  await page.getByLabel("Headline").fill("Data analyst");
  await page.getByLabel("First name").fill("Patricia");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toBeVisible();
  await expect(page.getByLabel("Patricia Kim, Applicant")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0199");
  await expect(page.getByLabel("Headline")).toHaveValue("Data analyst");
  await expect(page.getByLabel("First name")).toHaveValue("Patricia");
});

test("given a logged-in applicant, when they save a malformed phone number, then the field says why and nothing is saved", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);
  await page.goto("/profile");

  await page.getByLabel("Phone number").fill("call me maybe");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription("Enter a phone number like (254) 555-0142.");
  await expect(page.getByLabel("Phone number")).toBeFocused();
  await expect(page.getByText("Profile saved")).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0142");
});
