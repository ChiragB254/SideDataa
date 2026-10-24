import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/",
  "/services",
  "/services/ai-development",
  "/services/web-development",
  "/services/server-management",
  "/services/cloud-services",
  "/services/it-services",
  "/about",
  "/careers",
  "/contact",
  "/privacy",
  "/terms",
  "/accessibility",
  "/form-status?form=contact&result=sent",
  "/this-page-does-not-exist",
];

for (const route of routes) {
  test(`no serious or critical axe violations: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      bad,
      JSON.stringify(
        bad.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}

test("mobile menu opens, is keyboard operable and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  const button = page.locator('button[aria-controls="mobile-menu"]');
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

test("contact form shows an error summary for empty submission", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("heading", { name: /problems with your submission/ }),
  ).toBeVisible();
  await expect(page.getByLabel(/^Name/)).toHaveAttribute("aria-invalid", "true");
});

test("form-status falls back safely for prototype-like result values", async ({
  page,
}) => {
  for (const result of ["__proto__", "constructor", "toString"]) {
    await page.goto(`/form-status?form=contact&result=${result}`);
    await expect(page.locator("h1")).toHaveText(/could not send your message/i);
  }
});

test("404 page has no canonical link", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
