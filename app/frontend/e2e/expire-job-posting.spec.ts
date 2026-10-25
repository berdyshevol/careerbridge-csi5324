import { expect, test } from "@playwright/test";

// UC-13 Expire Job Posting, against the sample data in jobs.csv. Warehouse Coordinator, the
// ninth row, is loaded as Published with a deadline that has passed, so the expiration job
// closes it once the backend is ready.

test("the expiration job closes a published posting past its deadline", async ({ request }) => {
  const posting = await (await request.get("http://localhost:8080/api/postings/9")).json();

  expect(posting.title).toBe("Warehouse Coordinator");
  expect(posting.postStatus).toBe("CLOSED");
});

test("a posting past its deadline is gone from the job board", async ({ page }) => {
  await page.goto("/jobs");

  await expect(page.getByText("Junior Software Engineer")).toBeVisible();
  await expect(page.getByText("Warehouse Coordinator")).toHaveCount(0);
});

test("a posting past its deadline no longer offers to apply", async ({ page }) => {
  await page.goto("/jobs/9");

  await expect(page.getByRole("heading", { level: 1, name: "Warehouse Coordinator" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("This posting is no longer accepting applications.");
  await expect(page.getByRole("link", { name: "Apply" })).toHaveCount(0);
});

test("the backend refuses an application to a posting past its deadline", async ({ request }) => {
  const response = await request.post("http://localhost:8080/api/postings/9/application", {
    data: { resumeFileName: "Jordan_Lee_Resume.pdf", resumeFileType: "application/pdf", resumeFileSize: 184_320 },
  });

  expect(response.status()).toBe(409);
  expect(await response.json()).toMatchObject({
    reason: "POSTING_CLOSED",
    message: "This posting no longer accepts applications.",
  });
});
