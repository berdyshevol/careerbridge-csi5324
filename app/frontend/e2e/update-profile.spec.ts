import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, registerNewApplicant } from "./accounts";

// UC-03 Update Applicant Profile, CO-03.1 to CO-03.3 (spec/use-cases.md), as Given / When / Then

test("given a logged-in applicant, when they open their profile, then it shows their own details from the backend", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Profile & resume" })).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Jordan");
  await expect(page.getByLabel("Last name")).toHaveValue("Lee");
  await expect(page.getByLabel("Email address")).toHaveValue(ACCOUNTS.applicant.email);
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0142");
  // The demo applicant's resume on file; the tests that upload one register an applicant of their own
  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toBeVisible();
  await expect(page.getByText(/No resume on file yet/)).toHaveCount(0);
});

test("given a new applicant, when they change their phone and headline and save, then both are still there after a reload", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "profile", testInfo.project.name);

  await page.getByLabel("Phone number").fill("(254) 555-0199");
  await page.getByLabel("Headline").fill("Data analyst");
  await page.getByLabel("First name").fill("Patricia");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved" })).toBeVisible();
  await expect(page.getByLabel("Patricia Kim, Applicant")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0199");
  await expect(page.getByLabel("Headline")).toHaveValue("Data analyst");
  await expect(page.getByLabel("First name")).toHaveValue("Patricia");
});

test("given a logged-in applicant, when they save a malformed phone number, then the field says why and nothing is saved", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);
  await page.goto("/profile");

  await page.getByLabel("Phone number").fill("call me maybe");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription("Enter a phone number like (254) 555-0142.");
  await expect(page.getByLabel("Phone number")).toBeFocused();
  await expect(page.getByText("Profile saved")).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("(254) 555-0142");
});

test("given a new applicant, when they upload a PDF resume, then its name and upload date are still there after a reload", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "resume", testInfo.project.name);
  await expect(page.getByText(/No resume on file yet/)).toBeVisible();

  await page.getByLabel("Choose your resume").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await page.getByRole("button", { name: "Upload resume" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Resume uploaded" })).toBeVisible();

  await page.reload();
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
  // The date the backend recorded, which is today
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  await expect(page.getByText(`Uploaded ${today}`)).toBeVisible();
  await expect(page.getByText(/No resume on file yet/)).toHaveCount(0);
});

test("given an applicant with a resume, when they upload a text file, then the field says why and the resume stays on file", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "refused", testInfo.project.name);
  await page.getByLabel("Choose your resume").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await page.getByRole("button", { name: "Upload resume" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Resume uploaded" })).toBeVisible();

  await page.getByLabel("Replace your resume").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Pat Kim, data analyst"),
  });
  await page.getByRole("button", { name: "Upload resume" }).click();

  await expect(page.getByLabel("Replace your resume")).toHaveAccessibleDescription(
    "The file is not a PDF or DOCX. Choose a PDF or DOCX file of at most 5 MB.",
  );
  await page.reload();
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
});
