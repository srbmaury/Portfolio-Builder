import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // Next dev only trusts "localhost" as a same-origin dev host. Browsing
    // 127.0.0.1 makes it block its own /_next/static chunks, so the app never
    // hydrates and every interactive expectation fails.
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Resume import calls Gemini whenever a key is present, which made the
    // suite depend on Google's latency: the parse test blew the 30s timeout
    // under parallel load, and every run spent free-tier quota. Blanking the
    // key pins the deterministic parser, which is what these tests assert.
    env: { GEMINI_API_KEY: "" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
