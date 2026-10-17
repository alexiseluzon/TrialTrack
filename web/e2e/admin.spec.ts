import { expect, test, type Page } from "@playwright/test";

const CODE = `E2E-${Date.now().toString().slice(-8)}`;

async function fillNewTrial(page: Page, code: string, title: string) {
  await page.getByRole("button", { name: "New trial" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Code").fill(code);
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Condition").fill("Asthma");
  await dialog.getByLabel("Phase", { exact: true }).selectOption({ label: "Phase 1" });
  await dialog.getByLabel("Status", { exact: true }).selectOption({ label: "Recruiting" });
  await dialog.getByLabel("Sponsor").selectOption({ index: 1 });
  await dialog.getByLabel("Start date").fill("2024-05-01");
  await dialog.getByLabel("Enrollment").fill("120");
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Signed in as demo_admin (admin)")).toBeVisible();
});

test("admin can create, edit and delete a trial", async ({ page }) => {
  // Create
  const dialog = await fillNewTrial(page, CODE, "E2E trial");
  await dialog.getByRole("button", { name: "Create trial" }).click();
  await expect(page.getByText("Trial created").first()).toBeVisible();
  await expect(dialog).toBeHidden();

  // Find it
  await page.getByLabel("Search trials").fill(CODE);
  const row = page.getByRole("row", { name: new RegExp(CODE) });
  await expect(row).toBeVisible();

  // Edit
  await row.getByRole("button", { name: `Edit ${CODE}` }).click();
  const edit = page.getByRole("dialog");
  await edit.getByLabel("Title").fill("E2E trial (edited)");
  await edit.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(`Updated ${CODE}`).first()).toBeVisible();
  await expect(row).toContainText("(edited)");

  // Delete, with confirmation
  await row.getByRole("button", { name: `Delete ${CODE}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText(`Deleted ${CODE}`).first()).toBeVisible();
  await expect(row).toHaveCount(0);
  await expect(page.getByText("No trials match your filters.")).toBeVisible();
});

test("duplicate code shows a server validation error", async ({ page }) => {
  const dialog = await fillNewTrial(page, "TT-00001", "Duplicate");
  await dialog.getByRole("button", { name: "Create trial" }).click();
  await expect(dialog.getByText(/already exists/i)).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("demo admin cannot modify seeded trials through the API", async ({ request }) => {
  const list = await request.get("/api/trials?search=TT-00001");
  const seeded = (await list.json()).results[0];
  const body = {
    code: seeded.code,
    title: "Hacked",
    condition: seeded.condition,
    phase: seeded.phase,
    status: seeded.status,
    sponsor: seeded.sponsor,
    start_date: seeded.start_date,
    enrollment: seeded.enrollment,
  };
  expect((await request.patch(`/api/trials/${seeded.id}`, { data: body })).status()).toBe(403);
  expect((await request.delete(`/api/trials/${seeded.id}`)).status()).toBe(403);
});