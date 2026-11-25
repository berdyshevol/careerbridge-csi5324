import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, tokenOf } from "./accounts";

// UC-13 extension *a: the recruiter closes their published posting from the postings list, and it
// leaves the job board. The recruiter acts for Waco Health Partners in the test configuration.

const API = "http://localhost:8080";

test("a recruiter closes their published posting, and it leaves the job board", async ({ page, request }, testInfo) => {
  const title = `Close Flow Clerk ${testInfo.project.name} ${Date.now()}`;
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const waco = (await (await request.get(`${API}/api/postings?organization=Waco Health Partners`)).json())[0].organization;
  const recruiter = await tokenOf(request, ACCOUNTS.recruiter);
  const created = await (
    await request.post(`${API}/api/postings`, {
      headers: recruiter,
      data: { organizationId: waco.organizationId, title, location: "On-site", employmentType: "Full-time", numberOfOpenings: 1, applicationDeadline: deadline },
    })
  ).json();
  expect((await request.post(`${API}/api/postings/${created.jobPostId}/submit`, { headers: recruiter })).ok()).toBeTruthy();
  const administrator = await tokenOf(request, ACCOUNTS.administrator);
  expect((await request.post(`${API}/api/admin/postings/${created.jobPostId}/approve`, { headers: administrator })).ok()).toBeTruthy();

  await logIn(page, ACCOUNTS.recruiter, "/recruiter/postings");
  const row = page.getByRole("listitem").filter({ hasText: title });
  await row.getByRole("button", { name: "Close" }).click();
  await page.getByRole("dialog", { name: `Close ${title}?` }).getByRole("button", { name: "Close posting, final" }).click();

  await expect(row.getByText("Closed · by recruiter")).toBeVisible();
  const open = await (await request.get(`${API}/api/postings?keyword=${encodeURIComponent(title)}`)).json();
  expect(open).toHaveLength(0);
});
