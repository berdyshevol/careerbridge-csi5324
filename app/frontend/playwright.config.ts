import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

// Another app may already hold 3000 on a developer's machine: E2E_FRONTEND_PORT=3200 npm run test:e2e
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3000);
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

// The user scenarios (spec/user-scenarios) become Playwright tests here; bddgen writes them before each run
const scenariosDir = defineBddConfig({
  features: "../../spec/user-scenarios/*.feature",
  featuresRoot: "../../spec/user-scenarios",
  steps: "e2e/scenarios/*.ts",
  outputDir: ".features-gen",
});

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
    { name: "laptop", testDir: "./e2e", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", testDir: "./e2e", use: { ...devices["Pixel 7"] } },
    // Laptop only: they check what the system does, which the screen width does not change
    { name: "scenarios", testDir: scenariosDir, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      // The test classpath: a fresh PostgreSQL in Docker (H2 without Docker), never the shared database in .env (ADR-0009)
      command: "./mvnw -q spring-boot:test-run",
      cwd: "../backend",
      env: { FRONTEND_ORIGINS: FRONTEND_URL },
      url: "http://localhost:8080/api/postings",
      // A backend already running on 8080 would be the developer's, on Neon: fail on the busy port instead
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
