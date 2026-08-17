import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
];

for (const viewport of viewports) {
  for (const locale of ["vi", "en"] as const) {
    test(`${locale} login fits ${viewport.width}x${viewport.height}`, async ({ page, context }) => {
      await page.setViewportSize(viewport);
      await context.addCookies([{ name: "lingora-locale", value: locale, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
      await page.goto("/login");
      const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
      await expect(page.getByRole("main")).toBeVisible();
    });
  }
}

test("login has no serious or critical axe violations and supports keyboard focus", async ({ page }) => {
  await page.goto("/login");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
