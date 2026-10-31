import { defineConfig, devices } from "@playwright/test";

/**
 * Second e2e pass: a production build that also includes the test posts in
 * tests/fixtures/blog (BLOG_FIXTURES=1) on port 3101. The main config
 * (playwright.config.ts) covers the real build, which has zero published posts.
 * Both builds write to .next, so run them one after the other (npm run test:e2e does).
 */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.fixtures.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx next start -p 3101",
    env: { BLOG_FIXTURES: "1" },
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
