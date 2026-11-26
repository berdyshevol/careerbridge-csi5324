import { expect, test } from "@playwright/test";

// Log In, forgotten password (FR-LI.1 to FR-LI.3), as Given / When / Then. Each test registers its own
// account through the API: changing a demo account's password would break the other tests.

const API_URL = "http://localhost:8080";
const OLD_PASSWORD = "Sunrise-2026x";
const NEW_PASSWORD = "Moonrise-2027y";

test("given a user who forgot their password, when they follow the reset link, then only the new password logs them in", async ({ page, request }, testInfo) => {
  const email = `reset.${testInfo.project.name}.${Date.now()}@example.com`;
  const registered = await request.post(`${API_URL}/api/applicants`, {
    data: { fullName: "Pat Reset", email, password: OLD_PASSWORD },
  });
  expect(registered.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  // The test backend hands the link back, as a demonstration without mail does
  await page.getByRole("link", { name: "Open the reset link" }).click();
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("heading", { name: "Your password is changed" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();

  await page.getByLabel("Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByLabel("Pat Reset, Applicant")).toBeVisible();
});

test("given a used reset link, when someone opens it again, then it is refused with a way to ask for a new one", async ({ page, request }, testInfo) => {
  const email = `reuse.${testInfo.project.name}.${Date.now()}@example.com`;
  await request.post(`${API_URL}/api/applicants`, { data: { fullName: "Pat Reuse", email, password: OLD_PASSWORD } });
  const asked = await request.post(`${API_URL}/api/auth/password-reset`, { data: { email } });
  const { resetLink } = await asked.json();
  const token = new URL(resetLink, "http://x").searchParams.get("token");
  await request.post(`${API_URL}/api/auth/password-reset/new-password`, { data: { token, password: NEW_PASSWORD } });

  await page.goto(resetLink);
  await page.getByLabel("New password", { exact: true }).fill("Another-2028z");
  await page.getByRole("button", { name: "Save new password" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toContainText("This link does not work.");
  await expect(page.getByRole("link", { name: "Ask for a new link" })).toHaveAttribute("href", "/forgot-password");
});
