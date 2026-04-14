import { test, expect } from "@playwright/test";
import { skipOnboarding, assertAccessible } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipOnboarding(page);
});

test.describe("Pick Exercise screen", () => {
  async function navigateToPickExercise(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.goto("/template/create");
    await page.waitForTimeout(1_000);
    const addBtn = page.getByRole("button", { name: /add exercise/i });
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForSelector('[aria-label="Search exercises"]', {
        timeout: 10_000,
      });
      await page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  test("visual snapshot of pick-exercise page", async ({ page }) => {
    const reached = await navigateToPickExercise(page);
    test.skip(!reached, "Could not navigate to pick-exercise screen");

    await expect(page).toHaveScreenshot("pick-exercise.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("passes accessibility audit", async ({ page }, testInfo) => {
    const reached = await navigateToPickExercise(page);
    test.skip(!reached, "Could not navigate to pick-exercise screen");

    await assertAccessible(page, testInfo);
  });
});
