import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/card", "/card/sidedata", "/card/chirag-bansal"]) {
  test(`axe, all WCAG tags and best practices: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag2aaa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
        "best-practice",
      ])
      // AAA enhanced contrast is not a project target; AA contrast is checked above.
      .disableRules(["color-contrast-enhanced"])
      .analyze();
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}

test("company card: contact actions, no phone, decorative QR with the URL as text", async ({
  page,
}) => {
  await page.goto("/card");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "SideData Technologies",
  );
  await expect(
    page.locator("article").getByRole("link", { name: /support@sidedataa\.com/ }),
  ).toHaveAttribute("href", "mailto:support@sidedataa.com");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save contact" })).toHaveAttribute(
    "href",
    "/card/sidedata/contact.vcf",
  );
  await expect(page.getByText("Toronto, Ontario, Canada").first()).toBeVisible();
  const qr = page.locator(
    "article svg[shape-rendering='crispEdges'][aria-hidden='true']",
  );
  await expect(qr).toHaveCount(1);
  await expect(
    page.locator("article").getByText("https://sidedataa.com/card"),
  ).toBeVisible();
});

test("person card: name, title, tel: and mailto: actions", async ({ page }) => {
  await page.goto("/card/chirag-bansal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chirag Bansal");
  await expect(page.getByText("CEO, SideData Technologies")).toBeVisible();
  const tel = page.getByRole("link", { name: /\+1 437 431 3144/ });
  await expect(tel).toHaveAttribute("href", "tel:+14374313144");
  await expect(
    page.getByRole("link", { name: /chirag\.bansal@sidedataa\.com/ }),
  ).toHaveAttribute("href", "mailto:chirag.bansal@sidedataa.com");
  await expect(page.getByText("https://sidedataa.com/card/chirag-bansal")).toBeVisible();
});

test("tap targets are at least 44px at 320px wide, and the page reflows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const route of ["/card", "/card/chirag-bansal"]) {
    await page.goto(route);
    for (const el of await page.locator("article a, article button").all()) {
      const box = await el.boundingBox();
      expect(box!.height, await el.innerText()).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    const w = await page.evaluate(() => ({
      sw: document.scrollingElement!.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(w.sw).toBeLessThanOrEqual(w.iw);
  }
});

test("Share button is hidden without Web Share support; Copy link reports politely", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    // Desktop Chromium on some platforms has navigator.share; make the test deterministic.
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    delete (navigator as unknown as Record<string, unknown>).share;
  });
  await page.goto("/card");
  await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
  const status = page.locator("article [role='status']");
  await expect(status).toHaveText("");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(status).toHaveText("Link copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://sidedataa.com/card",
  );
});

test("Share button appears and calls navigator.share when supported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __shared: unknown }).__shared = null;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: unknown) => {
        (window as unknown as { __shared: unknown }).__shared = data;
      },
    });
  });
  await page.goto("/card");
  await page.getByRole("button", { name: "Share" }).click();
  expect(
    await page.evaluate(() => (window as unknown as { __shared: unknown }).__shared),
  ).toEqual({
    title: "SideData Technologies",
    url: "https://sidedataa.com/card",
  });
});

test("footer links to the digital card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "Digital card" }).click();
  await expect(page).toHaveURL(/\/card$/);
});
