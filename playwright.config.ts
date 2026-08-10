import { defineConfig, devices } from "@playwright/test";

const port = 3005;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SKIP_ENV_VALIDATION: "true",
      USE_PILOT_COMMUNITY_CATALOG: "true",
      NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
      NEXT_PUBLIC_ROOT_DOMAIN: `localhost:${port}`,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
