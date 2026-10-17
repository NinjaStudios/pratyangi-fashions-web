import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the REAL store API and a real MySQL database (no stand-in accounts).
// `pnpm test:e2e:api` builds the site with NEXT_PUBLIC_API_URL pointing at the API started below, then runs e2e-api/.
// The API needs a MySQL database whose name ends in _test: set DB_USER, DB_PASSWORD, DB_NAME (and DB_HOST, DB_PORT if not the
// defaults) in the shell. See apps/api/README.md.
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
      command: "npx tsx src/server.ts",
      cwd: "../api",
      url: `http://localhost:${apiPort}/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: "development",
        PORT: String(apiPort),
        WEB_ORIGIN: `http://localhost:${webPort}`,
        DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
        DB_PORT: process.env.DB_PORT ?? "3306",
        DB_USER: process.env.DB_USER ?? "",
        DB_PASSWORD: process.env.DB_PASSWORD ?? "",
        DB_NAME: process.env.DB_NAME ?? "",
        GOOGLE_CLIENT_ID: "",
        SMTP_URL: "",
      },
    },
    { command: `serve out --listen ${webPort} --no-clipboard`, url: `http://localhost:${webPort}`, reuseExistingServer: false, timeout: 30_000 },
  ],
});
