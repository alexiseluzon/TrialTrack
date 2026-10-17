import { expect, test } from "@playwright/test";

import { ADMIN } from "./users";

const out = (name: string) => `../docs/screenshots/${name}.png`;
const ROWS = 21; // header + 20 rows

test.describe("public", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Username")).toBeVisible();
    await page.screenshot({ path: out("login") });
  });
});

test.describe("member", () => {
  test("registry and detail", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("row")).toHaveCount(ROWS);
    await page.screenshot({ path: out("registry") });

    await page.locator("tbody tr").first().getByRole("button").click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: /^Sites \(\d+\)$/ })).toBeVisible();
    await page.screenshot({ path: out("detail") });
  });
});

test.describe("admin", () => {
  test.use({ storageState: ADMIN.file });

  test("form dialog", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("row")).toHaveCount(ROWS);
    await page.getByRole("button", { name: "New trial" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({ path: out("admin-form") });
  });
});