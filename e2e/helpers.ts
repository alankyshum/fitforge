import { type Page, type TestInfo, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// react-native-paper / react-native-web render icon fonts as role="img"
// divs without alt text, and wrap FABs in nested interactive elements.
// These are upstream library issues we can't fix in app code.
const KNOWN_LIBRARY_RULES = ["role-img-alt", "nested-interactive"];

/**
 * Complete onboarding by clicking the Skip button so subsequent
 * navigation to the main app screens works.
 */
export async function skipOnboarding(page: Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: /skip/i });
  if (await skip.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await skip.click();
    await page.waitForURL(/^\/$|\/exercises|\/\(tabs\)/);
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
