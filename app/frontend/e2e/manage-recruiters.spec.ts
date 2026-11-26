import { expect, test, type APIRequestContext } from "@playwright/test";
import { ACCOUNTS, logIn, logOut, tokenOf } from "./accounts";

// Minimum scope Administrator 3, FR-ADM.2, as Given / When / Then. The test approves a recruiter of its own
// (UC-08, UC-10 through the API), so the demo recruiters the other tests use are never deactivated.

const API = "http://localhost:8080";
const PASSWORD = "Recruiter-2026x";

// Each browser project runs this at once, so each approves a recruiter with a name of its own
async function approvedRecruiter(request: APIRequestContext, name: string) {
  const email = `robin.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const organizations = await (await request.get(`${API}/api/organizations`)).json();
  const brazos = organizations.find((organization: { name: string }) => organization.name === "Brazos Analytics");
  const registered = await request.post(`${API}/api/recruiters`, {
    data: {
      fullName: name,
      jobTitle: "Recruiter",
      email,
      phone: "",
      password: PASSWORD,
      joinOrganizationId: brazos.organizationId,
    },
  });
  expect(registered.ok()).toBeTruthy();
  const token = new URL((await registered.json()).verificationLink, "http://x").searchParams.get("token");
  expect((await request.post(`${API}/api/recruiters/verification`, { data: { token } })).ok()).toBeTruthy();
  const administrator = await tokenOf(request, ACCOUNTS.administrator);
  const requests = await (await request.get(`${API}/api/admin/requests`, { headers: administrator })).json();
  const mine = requests.find((pending: { requesterName: string; requestId: number }) => pending.requesterName === name);
  expect((await request.post(`${API}/api/admin/requests/${mine.requestId}/approve`, { headers: administrator })).ok()).toBeTruthy();
  return email;
}

test("given an approved recruiter, when the administrator deactivates them, then they cannot log in until reactivated", async ({ page, request }, testInfo) => {
  const name = `Robin ${testInfo.project.name === "phone" ? "Phone" : "Laptop"}`;
  const email = await approvedRecruiter(request, name);
  const robin = page.getByRole("listitem").filter({ hasText: email });

  await logIn(page, ACCOUNTS.administrator);
  await page.goto("/admin/users");
  await robin.getByRole("button", { name: `Deactivate ${name}` }).click();
  await expect(robin).toContainText("Deactivated");
  await logOut(page);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "This account was deactivated by the administrator. Contact them to have it reactivated.",
  );

  await logIn(page, ACCOUNTS.administrator);
  await page.goto("/admin/users");
  await robin.getByRole("button", { name: `Reactivate ${name}` }).click();
  await expect(robin.getByRole("button", { name: `Deactivate ${name}` })).toBeVisible();
  await logOut(page);

  await logIn(page, { email, password: PASSWORD });
  await expect(page.getByLabel(`${name}, Recruiter`)).toBeVisible();
});
