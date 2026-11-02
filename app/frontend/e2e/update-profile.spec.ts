import path from "node:path";
import { expect, test } from "@playwright/test";
import { ACCOUNTS, logIn, registerNewApplicant } from "./accounts";

// UC-03 Update Applicant Profile, CO-03.1 to CO-03.3 (spec/use-cases.md), as Given / When / Then

test("given a logged-in applicant, when they open their profile, then it shows their own details from the backend", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { level: 1, name: "Profile and resume" })).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Jordan");
  await expect(page.getByLabel("Last name")).toHaveValue("Lee");
  await expect(page.getByLabel("Email")).toHaveValue(ACCOUNTS.applicant.email);
  await expect(page.getByLabel("Phone")).toHaveValue("(254) 555-0142");
  // The demo applicant's resume on file; the tests that upload one register an applicant of their own
  await expect(page.getByText("Jordan_Lee_Resume.pdf")).toBeVisible();
  await expect(page.getByText("No resume on file.")).toHaveCount(0);
});

test("given a new applicant, when they change their phone and headline and save, then both are still there after a reload", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "profile", testInfo.project.name);

  await page.getByLabel("Phone").fill("(254) 555-0199");
  await page.getByLabel("Headline").fill("Data analyst");
  await page.getByLabel("First name").fill("Patricia");
  await page.getByRole("button", { name: "Save details" }).click();
  // In the Details card beside the button, so a phone shows it without scrolling to it
  const saved = page.getByRole("form", { name: "Details" }).getByRole("status").filter({ hasText: "Profile saved." });
  await expect(saved).toBeInViewport();
  await expect(page.getByLabel("Patricia Kim, Applicant")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Phone")).toHaveValue("(254) 555-0199");
  await expect(page.getByLabel("Headline")).toHaveValue("Data analyst");
  await expect(page.getByLabel("First name")).toHaveValue("Patricia");
});

test("given a logged-in applicant, when they save a malformed phone number, then the field says why and nothing is saved", async ({ page }) => {
  await logIn(page, ACCOUNTS.applicant);
  await page.goto("/profile");

  await page.getByLabel("Phone").fill("call me maybe");
  await page.getByRole("button", { name: "Save details" }).click();

  await expect(page.getByLabel("Phone")).toHaveAccessibleDescription("Enter a phone number like (254) 555-0142.");
  await expect(page.getByLabel("Phone")).toBeFocused();
  await expect(page.getByText("Profile saved.")).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Phone")).toHaveValue("(254) 555-0142");
});

test("given a new applicant, when they choose a PDF resume, then it is uploaded and its name and date are still there after a reload", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "resume", testInfo.project.name);
  await expect(page.getByText("No resume on file.")).toBeVisible();

  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
  // The date the backend recorded, which is today
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  await expect(page.getByText(`Uploaded ${today}`)).toBeVisible();
  await expect(page.getByText("No resume on file.")).toHaveCount(0);
  await expect(page.getByText("Applications you already sent keep the resume they were sent with.")).toBeVisible();
});

test("given an applicant with a resume, when they choose a text file, then it is refused and the resume stays on file", async ({ page }, testInfo) => {
  await registerNewApplicant(page, "refused", testInfo.project.name);
  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "fixtures", "Pat_Kim_Resume.pdf"));
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();

  await page.getByLabel("Choose a file").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Pat Kim, data analyst"),
  });

  const refusal =
    "notes.txt was not uploaded. Use a PDF or DOCX file of 5 MB or less. Your current resume is still on file.";
  await expect(page.getByText("notes.txt was not uploaded.")).toBeVisible();
  await expect(page.getByLabel("Choose a file")).toHaveAccessibleDescription(
    `PDF or DOCX, up to 5 MB. It replaces the one above. ${refusal}`,
  );
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pat_Kim_Resume.pdf")).toBeVisible();
});
