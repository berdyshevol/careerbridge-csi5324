import { expect, test } from "@playwright/test";

// UC-06 Withdraw Application, against sample application #2 (Backend Developer at INTERVIEW).

test("an applicant previews the final withdrawal warning, cancels or confirms withdrawal", async ({ page }) => {
  await page.route("**/api/applications/2/withdraw", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applicationId: 2,
        postingId: 1,
        title: "Backend Developer",
        organizationName: "Brazos Analytics",
        location: "Remote",
        employmentType: "Full-time",
        dateApplied: "2026-09-29",
        applicationStatus: "WITHDRAWN",
        lastUpdatedDate: "2026-10-14",
        rejectionReason: null,
        rejectedAtStage: null,
        rejectionDate: null,
        withdrawnAt: "2026-10-14T15:30:00Z",
        withdrawalReason: "Accepted another offer: Starting next month",
        statusHistory: [
          { status: "APPLIED", date: "2026-09-29", reason: null },
          { status: "SCREENING", date: "2026-10-02", reason: null },
          { status: "INTERVIEW", date: "2026-10-07", reason: null },
          { status: "WITHDRAWN", date: "2026-10-14", reason: "Accepted another offer: Starting next month" },
        ],
        interviews: [],
        offer: null,
        availableActions: [],
        activeApplicationCount: 2,
      }),
    });
  });

  await page.goto("/applications");
  await page.getByRole("button", { name: "Backend Developer" }).click();

  await page.getByRole("button", { name: "Withdraw application" }).click();

  await expect(page.getByRole("heading", { name: "Withdraw application for Backend Developer" })).toBeVisible();
  await expect(page.getByText(/Withdrawal is final and cannot be undone/)).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Withdraw application for Backend Developer" })).toHaveCount(0);

  await page.getByRole("button", { name: "Withdraw application" }).click();
  const confirmButton = page.getByRole("button", { name: "Confirm withdrawal" });
  await expect(confirmButton).toBeDisabled();

  await page.getByLabel("Reason for withdrawing (optional)").selectOption("Accepted another offer");
  await page.getByLabel("Additional comment (optional)").fill("Starting next month");
  await page.getByRole("checkbox").check();
  await confirmButton.click();

  await expect(page.getByText(/Application withdrawn for Backend Developer/)).toBeVisible();
  await expect(page.getByText(/Reason: Accepted another offer: Starting next month/)).toBeVisible();
});
