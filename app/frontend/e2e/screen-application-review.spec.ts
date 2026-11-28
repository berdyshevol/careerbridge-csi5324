import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn } from "./accounts";
import { Cast, applyByApi, postingByApi } from "./scenarios/driver";

// UC-14 steps 3-4, extensions 3a and *a: the recruiter opens a posting's applicants, reviews one
// application, and another organization's application looks like one that does not exist. The test
// backend sets Waco Health Partners as the organization the recruiter acts for (STAND-IN, SCRUM-198).

const API = "http://localhost:8080";

test("a recruiter opens a posting's applicants by stage and reviews one application", async ({ page, request }) => {
  const cast = new Cast();
  await postingByApi(request, cast, "Data Analyst", true, true);
  const posting = cast.posting("Data Analyst");
  await applyByApi(request, cast, cast.person("Sam"), posting);
  await applyByApi(request, cast, cast.person("Jo"), posting);

  await logIn(page, ACCOUNTS.recruiter, "/recruiter/postings");
  await page.getByRole("link", { name: `Applicants of ${posting.title}` }).click();

  await expect(page.getByRole("heading", { level: 1, name: posting.title })).toBeVisible();
  const stages = page.getByRole("navigation", { name: "Stages" });
  await expect(stages.getByRole("button", { name: /^2\s*Applied$/ })).toHaveAttribute("aria-current", "true");
  await expect(stages.getByRole("button", { name: /^0\s*Screening$/ })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Sam Tester" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Jo Tester" })).toBeVisible();

  await page.getByRole("link", { name: "Open Sam Tester" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Sam Tester" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Resume sent with this application" })).toBeVisible();
  await expect(page.getByText("Pat_Kim_Resume.pdf").first()).toBeVisible();
  await expect(page.getByText(cast.person("Sam").email)).toBeVisible();
  const history = page.getByRole("heading", { name: "Stage history" }).locator("xpath=ancestor::section[1]");
  await expect(history.getByRole("listitem")).toHaveCount(1);
  await expect(history.getByText("Applied")).toBeVisible();
  // The review is read-only until the tickets that move, reject and record exist
  await expect(page.getByRole("button", { name: /Reject|Move|Extend/ })).toHaveCount(0);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Pat_Kim_Resume.pdf" }).click();
  expect((await download).suggestedFilename()).toBe("Pat_Kim_Resume.pdf");

  await page.getByRole("link", { name: new RegExp(`${posting.title} · Applied stage`) }).click();
  await expect(page.getByRole("heading", { level: 1, name: posting.title })).toBeVisible();
});

test("a posting that took no applications says so", async ({ page, request }) => {
  const cast = new Cast();
  await postingByApi(request, cast, "Quiet Clerk", true, true);

  await logIn(page, ACCOUNTS.recruiter, `/recruiter/postings/${cast.posting("Quiet Clerk").id}`);

  await expect(page.getByText("No applications.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Stages" })).toHaveCount(0);
});

test("another organization's application is reported as not found, like one that does not exist", async ({
  page,
  request,
}) => {
  const cast = new Cast();
  await postingByApi(request, cast, "Night Nurse", true, false);
  const theirs = cast.posting("Night Nurse");
  const applicant = cast.person("Pat");
  await applyByApi(request, cast, applicant, theirs);
  const applications = await (
    await request.get(`${API}/api/applicant/applications`, { headers: await cast.token(request, applicant) })
  ).json();
  const applicationId = (Array.isArray(applications) ? applications : applications.applications)[0].applicationId;

  await logIn(page, ACCOUNTS.recruiter, `/recruiter/applications/${applicationId}`);
  await expect(page.getByText("There is no application at this address.")).toBeVisible();
  await expect(page.getByText("Pat Tester")).toHaveCount(0);

  await page.goto("/recruiter/applications/999999999");
  await expect(page.getByText("There is no application at this address.")).toBeVisible();

  await page.goto(`/recruiter/postings/${theirs.id}`);
  await expect(page.getByText("There is no posting at this address.")).toBeVisible();
});

test("an applicant is told that only a recruiter reviews an application", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant, "/recruiter/applications/1");

  await expect(page.getByRole("heading", { name: "Recruiters only" })).toBeVisible();
});
