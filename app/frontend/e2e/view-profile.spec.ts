import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-03 steps 1–2, CO-03.1 (spec/use-cases.md), as Given / When / Then

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
