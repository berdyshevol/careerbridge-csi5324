import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    { name: "laptop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // The test classpath: a fresh PostgreSQL in Docker, never the shared database in .env (ADR-0009)
      command: "./mvnw -q spring-boot:test-run",
      cwd: "../backend",
      url: "http://localhost:8080/api/postings",
      // A backend already running on 8080 would be the developer's, on Neon: fail on the busy port instead
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      command: "npm run build && npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
