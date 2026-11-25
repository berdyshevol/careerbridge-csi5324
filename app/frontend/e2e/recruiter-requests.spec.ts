import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, logOut } from "./accounts";

// UC-08, UC-10 and UC-09 together, with a recruiter of its own so the two projects never meet:
// a visitor registers a recruiter and an organization and verifies the email, the administrator
// approves the request, and the new recruiter asks to join a second organization.

test("a registered recruiter is approved and asks to join another organization", async ({ page }, testInfo) => {
  const unique = `${testInfo.project.name}${Date.now()}`;
  const name = `Lee Huang${unique}`;
  const organization = `Freight ${unique} Co.`;
  const recruiter = { email: `lee.${unique}@freight${unique}.example`, password: "Sunrise-2026x" };

  // UC-08 steps 1-5
  await page.goto("/recruiter/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Job title").fill("HR manager");
  await page.getByLabel("Work email").fill(recruiter.email);
  await page.getByLabel("Password").fill(recruiter.password);
  await page.getByLabel("Legal name").fill(organization);
  await page.getByLabel("Website").fill(`freight${unique}.example`);
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  // Steps 6-8: the test database hands back the link the email would carry
  await page.getByRole("link", { name: "Open the verification link" }).click();
  await expect(page.getByRole("heading", { name: "Your request is under review" })).toBeVisible();

  // Extension *a: the pending recruiter gets the request's status, not a session
  await page.goto("/login");
  await page.getByLabel("Email").fill(recruiter.email);
  await page.getByLabel("Password").fill(recruiter.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/Your request is under review/)).toBeVisible();

  // UC-10: the request is in the queue; the Administrator approves it
  await logIn(page, ACCOUNTS.administrator, "/admin/requests");
  const queued = page.getByRole("link", { name: new RegExp(name) });
  await expect(queued).toContainText("New recruiter, new organization");
  await queued.click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/requests$/);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
  await logOut(page);

  // UC-09: the approved recruiter logs in and asks to join Lone Star Logistics
  await logIn(page, recruiter, "/recruiter/organizations");
  const memberships = page.getByRole("list", { name: "Your memberships" });
  await expect(memberships).toContainText(organization);
  await expect(memberships).toContainText("Active");

  async function askToJoin() {
    await page.getByLabel("Search organizations by name or website").fill("Lone Star");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("list", { name: "Organizations found" }).getByRole("button", { name: "Lone Star Logistics" }).click();
    await page.getByLabel("Your role at Lone Star Logistics").fill("Contract recruiter");
    await page.getByLabel("Why you recruit for them").fill("We share a hiring team for drivers.");
    await page.getByRole("button", { name: "Send request" }).click();
  }

  await askToJoin();
  await expect(memberships.getByRole("listitem").filter({ hasText: "Lone Star Logistics" })).toContainText("Pending");

  // Extension 6b: a second request shows the one already pending
  await askToJoin();
  await expect(page.getByRole("status")).toHaveText("You already asked to join Lone Star Logistics. Status: Pending.");
});
