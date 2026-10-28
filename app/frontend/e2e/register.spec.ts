import { expect, test } from "@playwright/test";
import { logIn } from "./accounts";

// UC-02 Register as Applicant, as Given / When / Then

test("given a visitor, when they register, then they are logged in on their profile and can log in again", async ({ page }, testInfo) => {
  const email = `pat.${testInfo.project.name}.${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Pat Kim");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Sunrise-2026x");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByLabel("Pat Kim, Applicant")).toBeVisible();

  await expect(page.getByText("Add your resume here to apply for jobs")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
  await logIn(page, { email: email.toUpperCase(), password: "Sunrise-2026x" });
  await expect(page.getByLabel("Pat Kim, Applicant")).toBeVisible();
});

test("given a one-word name and a weak password, when a visitor registers, then each field says what is wrong", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Pat");
  await page.getByLabel("Email").fill("pat@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Enter your first and last name.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await expect(page.getByLabel("Password")).toHaveAccessibleDescription(
    "The password needs at least 10 characters, including a letter and a number.",
  );
  await expect(page).toHaveURL(/\/register$/);
});

test("given an email that already has an account, when a visitor registers with it, then they are sent to log in", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Sam Rivera");
  await page.getByLabel("Email").fill("sam.rivera@example.com");
  await page.getByLabel("Password").fill("Sunrise-2026x");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toContainText("An account already exists");
  await page.getByRole("link", { name: "Go to log in" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
