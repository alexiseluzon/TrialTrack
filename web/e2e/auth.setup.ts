import { expect, test as setup } from "@playwright/test";

import { ADMIN, MEMBER } from "./users";

for (const user of [MEMBER, ADMIN]) {
  setup(`sign in as ${user.username}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(`Signed in as ${user.username}`)).toBeVisible();
    await page.context().storageState({ path: user.file });
  });
}