import { type Page, type TestInfo, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// react-native-paper / react-native-web render icon fonts as role="img"
// divs without alt text, and wrap FABs in nested interactive elements.
// These are upstream library issues we can't fix in app code.
const KNOWN_LIBRARY_RULES = ["role-img-alt", "nested-interactive"];

/**
 * Complete onboarding so navigation to main app screens works.
 *
 * On web with in-memory SQLite, onboarding state doesn't persist across
 * full page reloads. This completes the 3-step onboarding flow:
 * Welcome → Get Started → Setup (pick level) → Continue → Recommend → skip
 */
export async function skipOnboarding(page: Page) {
  await page.goto("/");

  const getStarted = page.getByRole("button", { name: /get started/i });
  if (await getStarted.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await completeOnboardingFlow(page);
  }
}

async function completeOnboardingFlow(page: Page) {
  const getStarted = page.getByRole("button", { name: /get started/i });
  if (await getStarted.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await getStarted.click();
    await page.waitForTimeout(500);
  }

  const beginner = page.getByText("Beginner");
  if (await beginner.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await beginner.click();
    await page.waitForTimeout(300);
  }
  const cont = page.getByRole("button", { name: /continue/i });
  if (await cont.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cont.click();
    await page.waitForTimeout(1_000);
  }

  const explore = page.getByRole("button", { name: /explore/i });
  if (await explore.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await explore.click();
    await page
      .waitForURL(/^\/$|\/exercises|\/\(tabs\)/, { timeout: 5_000 })
      .catch(() => {});
  }
}

/**
 * Navigate to a route within the app. On web with in-memory SQLite,
 * each page.goto() loses DB state, so we must re-complete onboarding
 * on every navigation.
 */
export async function navigateTo(page: Page, path: string) {
  if (path === "/" || path === "") return;

  await page.goto(path);
  await page.waitForTimeout(500);

  // The onboarding gate may have redirected us — complete it
  const getStarted = page.getByRole("button", { name: /get started/i });
  if (await getStarted.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await completeOnboardingFlow(page);
    // We're now at / — need to navigate to the target via the SPA
    // Use page.evaluate to push the route via history API + trigger a re-render
    if (path !== "/" && path !== "") {
      await page.evaluate((p) => {
        window.history.pushState({}, "", p);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, path);
      await page.waitForTimeout(1_000);
    }
  }
}

/**
 * Run axe-core and assert zero critical accessibility violations.
 * Serious violations are attached as annotations (warnings) to the test.
 * Critical violations cause a hard failure.
 */
export async function assertAccessible(page: Page, testInfo?: TestInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .disableRules(KNOWN_LIBRARY_RULES)
    .analyze();

  const critical = results.violations.filter((v) => v.impact === "critical");
  const serious = results.violations.filter((v) => v.impact === "serious");

  if (serious.length > 0 && testInfo) {
    const summary = serious.map(
      (v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`
    );
    testInfo.annotations.push({
      type: "a11y-warning",
      description: summary.join("; "),
    });
  }

  if (critical.length > 0) {
    const summary = critical.map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map((n) => n.html).join("\n  ")}`
    );
    expect(
      critical,
      `Critical accessibility violations:\n${summary.join("\n\n")}`
    ).toHaveLength(0);
  }

  return results;
}
