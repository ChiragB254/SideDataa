import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const TOOL = "/tools/ai-savings-estimator";
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(
    results.violations,
    JSON.stringify(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      null,
      2,
    ),
  ).toEqual([]);
}

const field = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).first();

test.describe("axe (WCAG 2.2 A/AA tags)", () => {
  test("/tools", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator("h1")).toHaveCount(1);
    await axe(page);
  });

  test("tool with example results", async ({ page }) => {
    await page.goto(TOOL);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByText("month 18").first()).toBeVisible();
    await axe(page);
  });

  test("tool with the data table open and a custom currency", async ({ page }) => {
    await page.goto(TOOL);
    await page.getByLabel("Currency label").selectOption("OTHER");
    await field(page, "Currency symbol or label").fill("AED");
    await page.getByText("Show the chart data as a table").click();
    await axe(page);
  });

  test("tool in an error state", async ({ page }) => {
    await page.goto(TOOL);
    await field(page, "Tasks per month").fill("abc");
    await field(page, "Tasks per month").blur();
    await field(page, "Minutes per task today").fill("");
    await field(page, "Minutes per task today").blur();
    await expect(page.getByTestId("error-summary")).toContainText(
      "2 fields need attention",
    );
    await expect(field(page, "Tasks per month")).toHaveAttribute("aria-invalid", "true");
    await axe(page);
  });

  test("tool with a negative result", async ({ page }) => {
    await page.goto(TOOL);
    await field(page, "Monthly run cost").fill("5000");
    await expect(page.getByTestId("break-even")).toContainText("does not break even");
    await axe(page);
  });
});

test("error summary links move focus to the field, and fixing clears the error", async ({
  page,
}) => {
  await page.goto(TOOL);
  const tasks = field(page, "Tasks per month");
  await tasks.fill("0");
  await tasks.blur();
  const link = page.getByTestId("error-summary").getByRole("link").first();
  await link.click();
  await expect(tasks).toBeFocused();
  await expect(tasks).toHaveAttribute("aria-describedby", /error/);
  await tasks.fill("500");
  await expect(tasks).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByTestId("error-summary")).toHaveCount(0);
});

test("share of tasks above 100 is rejected with a clear message", async ({ page }) => {
  await page.goto(TOOL);
  await field(page, "Tasks AI can fully handle").fill("80");
  await field(page, "Tasks where AI assists").fill("40");
  await field(page, "Tasks where AI assists").blur();
  await expect(page.getByTestId("error-summary")).toContainText(
    "cannot be more than 100%",
  );
  await expect(page.getByText("Results are paused")).toBeVisible();
});

test("keyboard only: enter values, see results, copy, reset", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(TOOL);
  await field(page, "Tasks per month").focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("800");
  await page.keyboard.press("Tab");
  await expect(field(page, "Minutes per task today")).toBeFocused();
  await expect(page.getByText("Net saving per month at full adoption")).toBeVisible();

  // Reaching the buttons by keyboard (they come after the form in the DOM).
  const copy = page.getByRole("button", { name: "Copy summary" });
  await copy.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Summary copied to the clipboard.",
  );
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("planning aid, not a forecast or a quote");
  expect(text).toContain("Tasks per month: 800 tasks");

  const reset = page.getByRole("button", { name: "Reset to example values" });
  await reset.focus();
  await page.keyboard.press("Space");
  await expect(field(page, "Tasks per month")).toHaveValue("400");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Reset to the example values.",
  );
});

test("the polite live summary updates once after a change, and not on load", async ({
  page,
}) => {
  await page.goto(TOOL);
  const live = page.getByTestId("live-summary");
  await expect(live).toHaveAttribute("aria-live", "polite");
  await expect(live).toHaveText("");
  await field(page, "Tasks per month").fill("800");
  // Settled, not per keystroke: still empty immediately after typing.
  await expect(live).toHaveText("");
  await expect(live).toHaveText(
    /^Expected case: net saving per month \$[\d,]+ at full adoption, payback in month \d+\.$/,
    { timeout: 3000 },
  );
  await field(page, "Monthly run cost").fill("50000");
  await expect(live).toHaveText(/net cost per month .* payback not within 36 months\./, {
    timeout: 3000,
  });
  await field(page, "Monthly run cost").fill("x");
  await expect(live).toHaveText("Results paused: 1 field needs attention.", {
    timeout: 3000,
  });
});

test("results change with the inputs and show the chart, table and working", async ({
  page,
}) => {
  await page.goto(TOOL);
  await expect(
    page.getByRole("img", { name: /Line chart of cumulative net/ }),
  ).toBeVisible();
  await expect(page.locator("#chart-summary")).toContainText("payback month 18");
  await page.getByText("Show the chart data as a table").click();
  await expect(
    page.getByRole("table", { name: /Cumulative net position/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: /Cumulative net position/ }).locator("tbody tr"),
  ).toHaveCount(37);
  await expect(
    page.getByText("39.2 hours x $45").or(page.getByText("39.2 hours")),
  ).not.toHaveCount(0);
  // Editing a multiplier changes the scenario table.
  await field(page, "Conservative: savings multiplier").fill("1");
  await expect(page.getByRole("table", { name: /Scenario results/ })).toContainText("x1");
  // Growth and error inputs change the totals.
  await field(page, "Extra work the freed time could absorb").fill("10");
  await field(page, "Value per extra unit").fill("200");
  await expect(
    page.getByText("Growth value, per month").locator("xpath=.."),
  ).toContainText("$1,000");
});

test("nothing entered leaves the page: no request carries the values; URL stays clean", async ({
  page,
}) => {
  await page.goto(TOOL);
  const seen: { method: string; url: string; body: string | null }[] = [];
  page.on("request", (r) =>
    seen.push({ method: r.method(), url: r.url(), body: r.postData() }),
  );
  await field(page, "Tasks per month").fill("123457");
  await field(page, "Monthly run cost").fill("98765");
  await field(page, "One-time build and integration cost").fill("55555");
  await page.getByRole("button", { name: "Copy summary" }).click();
  await page.waitForTimeout(1200);
  for (const r of seen) {
    expect(r.method).toBe("GET");
    expect(r.body).toBeNull();
    expect(r.url).not.toMatch(/123457|98765|55555/);
  }
  // Only static assets and Next.js link prefetches of our own pages (GET, no body).
  expect(
    seen.filter(
      (r) =>
        !/\/_next\/static\/|[?&]_rsc=/.test(r.url) && !/\.(woff2?|png|svg)$/.test(r.url),
    ),
  ).toEqual([]);
  expect(page.url()).toBe(`http://localhost:3100${TOOL}`);
  const stored = await page.evaluate(() => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
  }));
  expect(stored).toEqual({ local: 0, session: 0, cookie: "" });
});

test("a refresh clears the inputs (memory only)", async ({ page }) => {
  await page.goto(TOOL);
  await field(page, "Tasks per month").fill("999");
  await page.reload();
  await expect(field(page, "Tasks per month")).toHaveValue("400");
});

test("Download CSV works under the production CSP", async ({ page }) => {
  await page.goto(TOOL);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("ai-savings-estimate.csv");
  const stream = await download.createReadStream();
  let body = "";
  for await (const chunk of stream) body += chunk.toString();
  expect(body).toContain("Tasks per month,400,tasks");
  expect(body).toContain("Payback month,not within 36 months,18,13");
  expect(body.split("\r\n").filter((l) => /^\d+,/.test(l))).toHaveLength(37);
  await expect(page.getByTestId("action-status")).toContainText(
    "ai-savings-estimate.csv",
  );
});

test("320px: no horizontal scroll with results, error state and open table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(TOOL);
  const overflow = () =>
    page.evaluate(() => document.scrollingElement!.scrollWidth - window.innerWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByText("Show the chart data as a table").click();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await field(page, "Tasks per month").fill("abc");
  await field(page, "Tasks per month").blur();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await field(page, "Tasks per month").fill("1000000");
  await field(page, "Fully loaded cost per person-hour").fill("100000");
  await field(page, "Minutes per task today").fill("10000");
  expect(await overflow()).toBeLessThanOrEqual(0);
  await expect(page.getByText(/more than/).first()).toBeVisible();
});

test("controls are at least 44px tall and 24px wide minimum", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(TOOL);
  const sizes = await page.evaluate(() => {
    const out: string[] = [];
    const sel = "main button, main select, main input, main summary, main textarea";
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      if (r.height < 44 || r.width < 24)
        out.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  });
  expect(sizes).toEqual([]);
});

test("reduced motion: no animation or transition on the tool", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(TOOL);
  const moving = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll("main *")).filter((e) => {
        const s = getComputedStyle(e);
        return s.animationName !== "none" || parseFloat(s.transitionDuration) > 0.001;
      }).length,
  );
  expect(moving).toBe(0);
});

test("focus is never covered by the results card while tabbing the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(TOOL);
  await field(page, "Tasks per month").focus();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const covered = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && top !== el && !el.contains(top) && !top.contains(el);
    });
    expect(covered).toBe(false);
  }
});

test("metadata and structured data", async ({ page }) => {
  await page.goto(TOOL);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/tools\/ai-savings-estimator$/,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /tools\/ai-savings-estimator\/opengraph-image/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "{}")));
  const types = blocks.map((b) => b["@type"]);
  expect(types).toEqual(
    expect.arrayContaining(["WebApplication", "BreadcrumbList", "FAQPage"]),
  );
  const app = blocks.find((b) => b["@type"] === "WebApplication");
  expect(app.applicationCategory).toBe("BusinessApplication");
  expect(app.offers.price).toBe("0");
  expect(app.offers.priceCurrency).toBe("CAD");
  expect(app.author.name).toBe("Chirag Bansal");
  const faq = blocks.find((b) => b["@type"] === "FAQPage");
  expect(faq.mainEntity.length).toBeGreaterThanOrEqual(6);
  expect(faq.mainEntity.length).toBeLessThanOrEqual(8);
  const img = await page.request.get("/tools/ai-savings-estimator/opengraph-image");
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/png");
});

test("the page text avoids hype words, exclamation marks and invented claims", async ({
  page,
}) => {
  await page.goto(TOOL);
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const w of [
    "revolutionary",
    "cutting-edge",
    "seamless",
    "leverage",
    "synergy",
    "unlock",
    "empower",
    "game-changing",
    "next-level",
    "robust",
    "innovative",
    "world-class",
    "journey",
    "passionate",
    "cheapest",
  ])
    expect(text, w).not.toContain(w);
  expect(text).not.toContain("!");
  await expect(
    page.getByText("Written by Chirag Bansal, CEO, SideData Technologies"),
  ).toBeVisible();
});

test("links: tool to services and contact, home and service page to tool, nav and sitemap", async ({
  page,
}) => {
  await page.goto(TOOL);
  await expect(page.getByRole("link", { name: "Talk to us" })).toHaveAttribute(
    "href",
    "/contact",
  );
  await expect(
    page.locator('main a[href="/services/ai-development"]').first(),
  ).toBeVisible();
  await expect(page.locator('main a[href="/card/chirag-bansal"]')).toBeVisible();
  await page.goto("/");
  await expect(page.locator('main a[href="/tools/ai-savings-estimator"]')).toBeVisible();
  await page.goto("/services/ai-development");
  await expect(page.locator('main a[href="/tools/ai-savings-estimator"]')).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Tools" }),
  ).toHaveAttribute("href", "/tools");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/tools</loc>");
  expect(sitemap).toContain("/tools/ai-savings-estimator</loc>");
});

test("without JavaScript the page still reads and shows the example results", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:3100${TOOL}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AI savings and growth estimator",
  );
  await expect(page.getByText("month 18").first()).toBeVisible();
  await ctx.close();
});
