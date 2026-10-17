import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the REAL store API and a real MySQL database (no stand-in accounts).
// `pnpm test:e2e:api` builds the site with NEXT_PUBLIC_API_URL pointing at the API started below, then runs e2e-api/.
// The API needs a MySQL database whose name ends in _test, with the migrations applied (`pnpm api:migrate`): set DATABASE_URL in the
// shell. See apps/api/README.md. The API runs in development mode with no SMTP, so it prints each email to its console; that console
// is written to apps/api/api-e2e.log so the tests can read the verification link and reset code from it.
const webPort = 3100;
const apiPort = 4001;

export default defineConfig({
  testDir: "./e2e-api",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${webPort}`, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      command: "npx tsx src/server.ts > api-e2e.log 2>&1",
      cwd: "../api",
      url: `http://localhost:${apiPort}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: "development",
        PORT: String(apiPort),
        WEB_ORIGIN: `http://localhost:${webPort}`,
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        LOG_LEVEL: "silent",
        GOOGLE_CLIENT_ID: "",
        SMTP_URL: "",
      },
    },
    { command: `serve out --listen ${webPort} --no-clipboard`, url: `http://localhost:${webPort}`, reuseExistingServer: false, timeout: 30_000 },
  ],
});
