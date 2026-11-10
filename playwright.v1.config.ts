import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

/** V1 lab only — no migrate/seed. App must already be running. */
export default defineConfig({
  testDir: "e2e",
  testMatch: "v1-motion-lab.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL || "chrome",
      },
    },
  ],
});
