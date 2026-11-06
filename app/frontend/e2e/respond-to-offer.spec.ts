import { expect, test } from "@playwright/test";

// UC-07 Respond to Job Offer, against sample application #1 (IT Support Specialist at OFFER).

test("an applicant reviews offer terms, cancels or confirms accepting the offer", async ({ page }) => {
  await page.route("**/api/applications/1/offer/accept", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applicationId: 1,
        offerId: 1,
        applicationStatus: "HIRED",
        offerStatus: "ACCEPTED",
        responseDate: "2026-10-14",
        postingClosed: true,
        activeApplicationCount: 2,
      }),
    });
  });

  await page.goto("/offers");

  await expect(page.getByRole("heading", { level: 1, name: "IT Support Specialist" })).toBeVisible();
  await expect(page.getByText("$25 per hour")).toBeVisible();
  await expect(page.getByText(/Part-time, 20 hours per week on-site at Clinic A/)).toBeVisible();

  await page.getByRole("button", { name: "Accept offer" }).click();
  await expect(page.getByRole("heading", { name: "Confirm offer acceptance" })).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Confirm offer acceptance" })).toHaveCount(0);

  await page.getByRole("button", { name: "Accept offer" }).click();
  const confirmAccept = page.getByRole("button", { name: "Confirm acceptance" });
  await expect(confirmAccept).toBeDisabled();

  await page.getByRole("checkbox").check();
  await confirmAccept.click();

  await expect(page.getByRole("heading", { level: 1, name: "Offer accepted" })).toBeVisible();
  await expect(page.getByText(/Your acceptance filled the last opening for this position/)).toBeVisible();
});

test("an applicant can decline an extended offer with an optional reason", async ({ page }) => {
  await page.route("**/api/applications/1/offer/decline", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        applicationId: 1,
        offerId: 1,
        applicationStatus: "OFFER_DECLINED",
        offerStatus: "DECLINED",
        responseDate: "2026-10-14",
        postingClosed: false,
        activeApplicationCount: 2,
      }),
    });
  });

  await page.goto("/offers");
  await page.getByRole("button", { name: "Decline offer" }).click();

  await expect(page.getByRole("heading", { name: "Confirm declining this offer" })).toBeVisible();
  const confirmDecline = page.getByRole("button", { name: "Confirm decline" });
  await expect(confirmDecline).toBeDisabled();

  await page.getByLabel("Reason for declining (optional)").selectOption("Compensation or terms");
  await page.getByLabel("Additional comment (optional)").fill("Schedule conflict");
  await page.getByRole("checkbox").check();
  await confirmDecline.click();

  await expect(page.getByRole("heading", { level: 1, name: "Offer declined" })).toBeVisible();
});
