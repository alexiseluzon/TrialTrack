import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const header = 1;
const pageSize = 20;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("row")).toHaveCount(header + pageSize);
});

test("member sees the registry without admin controls", async ({ page }) => {
  await expect(page.getByText("Signed in as demo")).toBeVisible();
  await expect(page.getByRole("button", { name: "New trial" })).toHaveCount(0);
});

test("phase filter updates the URL and rows", async ({ page }) => {
  await page.getByLabel("Phase", { exact: true }).selectOption("P2");
  await expect(page).toHaveURL(/phase=P2/);
  const cells = page.locator("tbody tr td:nth-child(4)");
  await expect
    .poll(async () => {
      const texts = await cells.allTextContents();
      return texts.length > 0 && texts.every((t) => t === "Phase 2");
    })
    .toBe(true);
});

test("search narrows results", async ({ page }) => {
  await page.getByLabel("Search trials").fill("asthma");
  await expect(page).toHaveURL(/search=asthma/);
  const titles = page.locator("tbody tr td:nth-child(2)");
  await expect
    .poll(async () => {
      const texts = await titles.allTextContents();
      return texts.length > 0 && texts.every((t) => /asthma/i.test(t));
    })
    .toBe(true);
});

test("sorting toggles ascending and descending", async ({ page }) => {
  const firstCode = page.locator("tbody tr").first().locator("td").first();
  const sortByCode = page.getByRole("button", { name: "Code", exact: true });
  await sortByCode.click();
  await expect(firstCode).toHaveText("TT-00001");
  await sortByCode.click();
  await expect(firstCode).toHaveText("TT-00060");
});

test("pagination moves to page 2", async ({ page }) => {
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();
  await expect(page).toHaveURL(/page=2/);
});

test("detail panel loads trial and sites via GraphQL", async ({ page }) => {
  await page.locator("tbody tr").first().getByRole("button").click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: /^Sites \(\d+\)$/ })).toBeVisible();
});

test("members cannot create trials through the API", async ({ request }) => {
  const res = await request.post("/api/trials", {
    data: {
      code: "E2E-DENY",
      title: "Denied",
      condition: "None",
      phase: "P1",
      status: "active",
      sponsor: 1,
      start_date: "2024-01-01",
      enrollment: 1,
    },
  });
  expect(res.status()).toBe(403);
});

test("registry has no WCAG 2.1 AA violations", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});