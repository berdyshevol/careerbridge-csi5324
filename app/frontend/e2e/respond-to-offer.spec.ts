import { expect, test } from "@playwright/test";
import { logIn, ACCOUNTS } from "./accounts";

// UC-07 Respond to Job Offer: verifies offer terms, deadline, and both final confirmation dialogs (cancel keeps Offer unchanged)

test("given an application at Offer, when the applicant views the offer and cancels both confirmation dialogs, then the offer stays open", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/applications");

  const offerRow = page.getByRole("listitem").filter({ hasText: "IT Support Specialist" });
  await offerRow.getByRole("link", { name: "View" }).click();
  await expect(page).toHaveURL(/\/applications\/\d+$/);

  const offerSection = page.getByRole("region", { name: "Offer" });
  await expect(offerSection).toBeVisible();
  await expect(offerSection).toContainText(/Offer · respond by/i);
  await expect(offerSection).toContainText("$54,000 USD per year");
  await expect(offerSection).toContainText("Accepting or declining is final.");

  // Accept confirmation dialog opens and Go back leaves Offer unchanged (FR-UC07.3, ext 5a)
  await page.getByRole("button", { name: "Accept offer" }).click();
  await expect(page.getByRole("dialog")).toContainText("Accept the IT Support Specialist offer?");
  await expect(page.getByRole("dialog")).toContainText("You cannot change your answer afterwards.");
  await page.getByRole("button", { name: "Go back" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Decline confirmation dialog opens with optional reason and Escape leaves Offer unchanged (FR-UC07.3)
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.getByRole("dialog")).toContainText("Decline the IT Support Specialist offer?");
  await expect(page.getByLabel("Reason, optional")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Accept offer" })).toBeVisible();
});

