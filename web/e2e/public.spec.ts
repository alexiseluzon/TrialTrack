import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { MEMBER } from "./users";

test("unauthenticated visitors are redirected to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("submit stays disabled until the form is valid", async ({ page }) => {
  await page.goto("/login");
  const submit = page.getByRole("button", { name: "Sign in" });
  await expect(submit).toBeDisabled();
  await page.getByLabel("Username").fill("demo");
  await expect(submit).toBeDisabled();
  await page.getByLabel("Password", { exact: true }).fill("x");
  await expect(submit).toBeEnabled();
});

test("wrong password shows an error and stays on login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill(MEMBER.username);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid username or password.").first()).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("login page has no WCAG 2.1 AA violations", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Username")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("Try as member signs in with read-only access", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try as member" }).click();
  await expect(page.getByText("Signed in as demo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New trial" })).toHaveCount(0);
});

test("Try as admin cannot edit or delete seeded trials", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try as admin" }).click();
  await expect(page.getByText("Signed in as demo_admin (admin)")).toBeVisible();
  await expect(page.getByRole("button", { name: "New trial" })).toBeVisible();
  await page.getByLabel("Search trials").fill("TT-");
  await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Delete / })).toHaveCount(0);
});