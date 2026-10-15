import { expect, test } from "@playwright/test";

// UC-04 Apply for Job, against the sample postings in jobs.csv and the
// sample applicant (three active applications from the backend, resume on file).

// The application is saved, and a posting takes one application from the
// sample applicant, so each device applies to a posting of its own.
const postingFor = { laptop: { id: 2, title: "Data Analyst Intern" }, phone: { id: 8, title: "Logistics Analyst" } };

test("an applicant can cancel, then reviews, confirms and submits an application", async ({ page }, testInfo) => {
  const posting = postingFor[testInfo.project.name as keyof typeof postingFor];
  await page.goto(`/jobs/${posting.id}`);
  await page.getByRole("link", { name: "Apply" }).click();

  await expect(page).toHaveURL(new RegExp(`/jobs/${posting.id}/apply$`));
  await expect(page.getByRole("heading", { level: 1, name: posting.title })).toBeVisible();

  // Cancelling is part of this flow: once an application is saved, the form for
  // its posting is gone, so a spec of its own could not rely on finding it.
  await page.getByRole("link", { name: "Cancel" }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${posting.id}$`));
  await page.getByRole("link", { name: "Apply" }).click();

  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toBeVisible();
  await expect(page.getByText("of 5 in use")).toBeVisible();

  const submit = page.getByRole("button", { name: "Submit application" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await submit.click();

  await expect(page.getByRole("heading", { level: 1, name: "Application submitted" })).toBeVisible();
  // 4 of 5, or 5 of 5 when the other device has applied first
  await expect(page.getByText(/[45] of 5 active applications/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Track application status" })).toBeVisible();
});

test("a posting already applied to cannot be applied to again", async ({ page }) => {
  await page.goto("/jobs/3/apply");

  await expect(page.getByRole("status")).toContainText("You already applied to this posting");
  await expect(page.getByRole("button", { name: "Submit application" })).toHaveCount(0);
});

test("the desk counts the same applications as the backend", async ({ page, request }) => {
  // Retried: the other device may submit an application between the two reads
  await expect(async () => {
    const applications: { applicationStatus: string }[] = await (
      await request.get("http://localhost:8080/api/applicant/applications")
    ).json();
    const active = applications.filter((a) =>
      ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"].includes(a.applicationStatus),
    ).length;

    await page.goto("/");

    await expect(page.getByText(`${active} of 5 active`, { exact: true })).toBeVisible({ timeout: 2000 });
  }).toPass();
});
