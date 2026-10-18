import { defineConfig } from "@playwright/test";

const testPort = 4174;
const testBaseUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: testBaseUrl,
    // Full Chromium preserves real browser tab behavior in headless CI.
    channel: process.env.CI ? "chromium" : "chrome",
    colorScheme: "dark",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run preview -- --port ${testPort} --strictPort`,
    url: testBaseUrl,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
