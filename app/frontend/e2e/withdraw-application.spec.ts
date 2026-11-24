import path from "node:path";
import { expect, test } from "@playwright/test";
import { registerNewApplicant } from "./accounts";

// UC-06 Withdraw Application: fresh applicant applies, cancels once, then withdraws, freeing the slot while still blocking reapply (A5)

test("given an active application, when the applicant withdraws after confirming, then the stage becomes Withdrawn and the slot frees up", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "withdraw", testInfo.project.name);

  // Upload resume and apply to posting 1
  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();

  await page.goto("/jobs/1/apply");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();

  await page.getByRole("link", { name: "Track application status" }).click();
  await expect(page).toHaveURL(/\/applications$/);
  await expect(page.getByText("1")).toBeVisible();
  await expect(page.getByText("of 5 active")).toBeVisible();

  await page.getByRole("link", { name: "View" }).click();
  await expect(page).toHaveURL(/\/applications\/\d+$/);

  // Cancel first: nothing changes (FR-UC06.3)
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/cannot reapply/i)).toBeVisible();
  await page.getByRole("button", { name: "Go back" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Confirm withdrawal with reason (FR-UC06.5, FR-UC06.6)
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await page.getByLabel("Reason, optional").selectOption("No longer interested");
  await page.getByRole("button", { name: "Withdraw, final" }).click();

  await expect(page.getByText(/Withdrawn on/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Withdraw application" })).toHaveCount(0);

  // Slot freed on /applications
  await page.getByRole("link", { name: /All applications/ }).click();
  await expect(page.getByText("0")).toBeVisible();
  await expect(page.getByText("of 5 active")).toBeVisible();

  // Reapplying to the same posting is still blocked (A5)
  await page.goto("/jobs/1/apply");
  await expect(page.getByRole("status")).toContainText("You already applied to this posting");
});

