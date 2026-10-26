import { defineConfig, devices } from "@playwright/test";

// Another app may already hold 3000 on a developer's machine: E2E_FRONTEND_PORT=3200 npm run test:e2e
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3000);
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: FRONTEND_URL,
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    { name: "laptop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "./mvnw -q spring-boot:run",
      cwd: "../backend",
      env: { FRONTEND_ORIGINS: FRONTEND_URL },
      url: "http://localhost:8080/api/postings",
      // A backend already running on 8080 would not allow FRONTEND_URL: fail on the busy port instead
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: `npm run build && npm run start -- -p ${FRONTEND_PORT}`,
      url: FRONTEND_URL,
      // Whatever already listens there may be another app or an old build: fail on the busy port instead
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
