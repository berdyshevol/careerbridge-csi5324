import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";

// UC-05 Track Application Status (Slice 1: applications list, slot count, empty state, filter)

test("given an applicant with applications, when they open Applications, then they see their list, active count and filter tabs", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/applications");

  await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
  await expect(page.getByText("of 5 active")).toBeVisible();
  await expect(page.getByText("IT Support Specialist")).toBeVisible();
  await expect(page.getByText("Backend Developer")).toBeVisible();
  await expect(page.getByText("Junior Software Engineer")).toBeVisible();

  const reviewOffer = page.getByRole("link", { name: "Review offer" });
  await expect(reviewOffer).toBeVisible();
  await expect(reviewOffer).toHaveAttribute("href", /^\/applications\/\d+$/);

  const filterNav = page.getByRole("navigation", { name: "Filter applications" });
  await expect(filterNav.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "true");

  await filterNav.getByRole("link", { name: "Active" }).click();
  await expect(page).toHaveURL(/\/applications\?filter=active$/);
  await expect(filterNav.getByRole("link", { name: "Active" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("IT Support Specialist")).toBeVisible();

  await filterNav.getByRole("link", { name: "Closed" }).click();
  await expect(page).toHaveURL(/\/applications\?filter=closed$/);
  await expect(filterNav.getByRole("link", { name: "Closed" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("No closed applications.")).toBeVisible();
});

test("given an applicant with no applications, when they open Applications, then they see the empty state linking to open jobs", async ({ page }) => {
  await logIn(page, ACCOUNTS.secondApplicant, "/applications");

  await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
  await expect(page.getByText("of 5 active")).toBeVisible();
  await expect(page.getByText("You have not applied to any job yet.")).toBeVisible();
  await page.getByRole("link", { name: "Find open jobs" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
});

test("given a visitor, when they open Applications, then they log in and come back to Applications", async ({ page }) => {
  await page.goto("/applications");
  await expect(page.getByRole("heading", { name: "Log in to see your applications" })).toBeVisible();

  await page.getByRole("main").getByRole("link", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(ACCOUNTS.secondApplicant.email);
  await page.getByLabel("Password").fill(ACCOUNTS.secondApplicant.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/applications$/);
  await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
});

test("given a recruiter, when they open Applications, then they are told only applicants have applications", async ({ page }) => {
  await logIn(page, ACCOUNTS.recruiter);
  await page.goto("/applications");
  await expect(page.getByRole("heading", { name: "Applicants only" })).toBeVisible();
});

test("given an applicant with an interview, when they open its detail page, then they see stage history and interview details without outcomes", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/applications");

  const backendRow = page.getByRole("listitem").filter({ hasText: "Backend Developer" });
  await backendRow.getByRole("link", { name: "View" }).click();

  await expect(page).toHaveURL(/\/applications\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: "Backend Developer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stage history" })).toBeVisible();
  await expect(page.getByText(/On-site, 1200 Austin Ave, Waco/)).toBeVisible();
  // BR-12, A12: recruiter outcomes and internal notes are never shown
  await expect(page.getByText("Passed")).toHaveCount(0);
  await expect(page.getByText("Internal panel note")).toHaveCount(0);
});

test("given another applicant, when they open someone else's application URL, then they see not found and no details", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/applications");
  const href = await page.getByRole("link", { name: "Review offer" }).getAttribute("href");
  expect(href).toMatch(/^\/applications\/\d+$/);

  await logIn(page, ACCOUNTS.secondApplicant, href!);
  await expect(page.getByText("This application could not be found.")).toBeVisible();
  await expect(page.getByText("IT Support Specialist")).toHaveCount(0);
});

