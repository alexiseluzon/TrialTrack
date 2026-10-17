import { defineConfig, devices } from "@playwright/test";

import { ADMIN, MEMBER, PASSWORD } from "./e2e/users";

const API = "http://127.0.0.1:8100";
const WEB = "http://127.0.0.1:3100";

// Fresh SQLite DB every run so tests are deterministic.
const apiCommand = [
  `python -c "import pathlib; pathlib.Path('e2e.sqlite3').unlink(missing_ok=True)"`,
  "python manage.py migrate --noinput",
  "python manage.py seed_demo",
  "python manage.py runserver 127.0.0.1:8100 --noreload",
].join(" && ");

const chrome = { ...devices["Desktop Chrome"] };
const firefox = { ...devices["Desktop Firefox"] };
const webkit = { ...devices["Desktop Safari"] };

const screenshots = {
  name: "screenshots",
  testMatch: /screenshots\.shot\.ts/,
  dependencies: ["setup"],
  use: { ...chrome, storageState: MEMBER.file },
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: { baseURL: WEB, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testMatch: /public\.spec\.ts/, use: chrome },
    { name: "member", testMatch: /member\.spec\.ts/, dependencies: ["setup"], use: { ...chrome, storageState: MEMBER.file } },
    { name: "member-firefox", testMatch: /member\.spec\.ts/, dependencies: ["setup"], use: { ...firefox, storageState: MEMBER.file } },
    { name: "member-webkit", testMatch: /member\.spec\.ts/, dependencies: ["setup"], use: { ...webkit, storageState: MEMBER.file } },
    { name: "admin", testMatch: /admin\.spec\.ts/, dependencies: ["setup"], use: { ...chrome, storageState: ADMIN.file } },
    ...(process.env.SHOTS ? [screenshots] : []),
  ],
  webServer: [
    {
      command: apiCommand,
      cwd: "../api",
      url: `${API}/health/`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        DJANGO_SECRET_KEY: "e2e-only-not-a-secret",
        DJANGO_DEBUG: "1",
        DJANGO_ALLOWED_HOSTS: "127.0.0.1,localhost",
        DATABASE_URL: "sqlite:///e2e.sqlite3",
        DB_SSL_REQUIRE: "0",
        CORS_ALLOWED_ORIGINS: "",
        DEMO_PASSWORD: PASSWORD,
        THROTTLE_LOGIN: "1000/min",
      },
    },
    {
      command: "npm run build && npm run start -- -p 3100",
      url: `${WEB}/login`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        API_URL: API,
        COOKIE_SECURE: "0",
        DEMO_MEMBER_PASSWORD: PASSWORD,
        DEMO_ADMIN_PASSWORD: PASSWORD,
      },
    },
  ],
});