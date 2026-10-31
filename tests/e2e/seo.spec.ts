import { expect, test, type Page } from "@playwright/test";
import { JSDOM } from "jsdom";

/** Runs against the normal production build: zero published posts. */

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => e.textContent ?? ""));
  return raw.map((r) => JSON.parse(r) as Record<string, unknown>);
}
const types = (nodes: Record<string, unknown>[]) => nodes.map((n) => n["@type"]);

test("robots.txt allows the search and AI bots, blocks /api/ and /form-status, lists the sitemap", async ({
  request,
}) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  for (const bot of [
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "GPTBot",
    "Claude-SearchBot",
    "Claude-User",
    "ClaudeBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
  ]) {
    expect(text).toContain(`User-Agent: ${bot}`);
  }
  expect(text).toContain("Disallow: /api/");
  expect(text).toContain("Disallow: /form-status");
  expect(text).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
  expect(text).not.toMatch(/Disallow: \/\s*$/m);
});

test("sitemap lists no noindex page, no blog while empty, and no invented dates", async ({
  request,
}) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  expect(locs.length).toBeGreaterThan(15);
  expect(locs.some((l) => l.includes("/blog"))).toBe(false);
  expect(locs.some((l) => l.includes("/card/chirag-bansal"))).toBe(false);
  expect(locs.some((l) => l.endsWith("/form-status"))).toBe(false);
  expect(locs).toContain("https://sidedataa.com/authors/chirag-bansal");
  expect(locs).toContain("https://sidedataa.com/about/editorial-policy");
  expect(xml).not.toMatch(/changefreq|priority/);
  // lastmod appears only where a real date exists (estimator, policy).
  expect([...xml.matchAll(/<lastmod>/g)].length).toBe(3);
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    const html = await res.text();
    expect(html, path).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
  }
});

test("empty blog: honest page, noindex, no Blog nav link, no feed link", async ({
  page,
}) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Articles are coming.",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" }),
  ).toHaveCount(0);
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(0);
});

test("blog sub-routes and unknown posts return 404 when nothing is published", async ({
  request,
}) => {
  for (const p of [
    "/blog/page/2",
    "/blog/topic/ai",
    "/blog/fixture-draft-secret",
    "/blog/anything",
  ]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
});

test("feed.xml is well-formed RSS 2.0 (empty channel until the first post)", async ({
  request,
}) => {
  const res = await request.get("/feed.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/rss+xml");
  const doc = new JSDOM(await res.text(), { contentType: "text/xml" }).window.document;
  expect(doc.querySelector("parsererror")).toBeNull();
  expect(doc.documentElement.getAttribute("version")).toBe("2.0");
  expect(doc.querySelectorAll("item")).toHaveLength(0);
});

test("home emits Organization and WebSite with no sameAs, ratings or reviews", async ({
  page,
}) => {
  await page.goto("/");
  const nodes = await jsonLd(page);
  expect(types(nodes)).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
  const org = nodes.find((n) => n["@type"] === "Organization")!;
  expect(org.logo).toMatch(/^https:\/\/.+\/logo\.png$/);
  for (const k of ["sameAs", "aggregateRating", "review", "foundingDate"]) {
    expect(org).not.toHaveProperty(k);
  }
  // The absolute production URL is not reachable from CI; check the local file instead.
  expect((await page.request.get("/logo.png")).status()).toBe(200);
});

test("author page: Person and ProfilePage match the visible content", async ({
  page,
}) => {
  await page.goto("/authors/chirag-bansal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chirag Bansal");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const bio =
    "Chirag Bansal is the CEO of SideData Technologies, an AI engineer based in Toronto. He is Google Cloud Certified: Generative AI Leader and active in the AWS and AI community.";
  await expect(page.getByText(bio)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /linkedin\.com\/in\/chiragb254/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /github\.com\/ChiragB254/ })).toBeVisible();

  const nodes = await jsonLd(page);
  expect(types(nodes)).toEqual(expect.arrayContaining(["ProfilePage", "BreadcrumbList"]));
  const profile = nodes.find((n) => n["@type"] === "ProfilePage") as {
    mainEntity: Record<string, unknown>;
  };
  expect(profile.mainEntity["@type"]).toBe("Person");
  expect(profile.mainEntity.description).toBe(bio);
  expect(profile.mainEntity.jobTitle).toBe("CEO");
  expect(profile.mainEntity.sameAs).toEqual([
    "https://www.linkedin.com/in/chiragb254/",
    "https://github.com/ChiragB254",
  ]);
  expect(JSON.stringify(profile)).not.toMatch(/rating|review/i);
});

test("editorial policy page states the plain policy and the review date", async ({
  page,
}) => {
  await page.goto("/about/editorial-policy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "How we write and review",
  );
  await expect(page.getByText(/AI tools may help with drafting/)).toBeVisible();
  await expect(
    page.locator("#main").getByRole("link", { name: "support@sidedataa.com" }),
  ).toBeVisible();
  await expect(page.getByText(/Last reviewed:/)).toBeVisible();
});

const deep = [
  ["/services/ai-development", ["Home", "Services", "AI development"]],
  [
    "/services/web-development",
    ["Home", "Services", "Website and web application development"],
  ],
  ["/tools", ["Home", "Tools"]],
  ["/tools/ai-savings-estimator", ["Home", "Tools", "AI savings and growth estimator"]],
  ["/authors/chirag-bansal", ["Home", "About", "Chirag Bansal"]],
  ["/about/editorial-policy", ["Home", "About", "Editorial policy"]],
] as const;

for (const [route, names] of deep) {
  test(`visible breadcrumb and BreadcrumbList agree: ${route}`, async ({ page }) => {
    await page.goto(route);
    const nav = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(nav.getByRole("listitem")).toHaveText(
      names.map((n) => new RegExp(`^${n.replace(/[()]/g, "\\$&")}`)),
    );
    await expect(nav.locator('[aria-current="page"]')).toHaveText(names.at(-1)!);
    const crumbs = (await jsonLd(page)).find((n) => n["@type"] === "BreadcrumbList") as {
      itemListElement: { name: string; item: string }[];
    };
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(names);
    expect(crumbs.itemListElement.every((i) => i.item.startsWith("https://"))).toBe(true);
  });
}

test("service pages: Service JSON-LD, visible FAQ equals FAQPage, related links", async ({
  page,
}) => {
  await page.goto("/services/ai-development");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const nodes = await jsonLd(page);
  const service = nodes.find((n) => n["@type"] === "Service")!;
  expect(service.name).toBe("AI development");
  expect(service).not.toHaveProperty("areaServed");
  expect(JSON.stringify(service)).not.toMatch(/price|rating|review/i);

  const faq = nodes.find((n) => n["@type"] === "FAQPage") as {
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };
  const visibleQ = await page.locator("[data-faq-q]").allTextContents();
  const visibleA = await page.locator("[data-faq-a]").allTextContents();
  expect(faq.mainEntity.map((q) => q.name)).toEqual(visibleQ);
  expect(faq.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(visibleA);
  expect(visibleQ.length).toBeGreaterThanOrEqual(3);

  await expect(
    page.getByRole("heading", { name: "What helps us get started." }),
  ).toBeVisible();
  const related = page.locator("#related");
  await expect(
    related.getByRole("link", { name: "AI savings and growth estimator" }),
  ).toBeVisible();
  await expect(related.getByRole("link", { name: "Contact us" })).toBeVisible();
  await expect(related.getByRole("link", { name: "Cloud services" })).toBeVisible();
});

test("estimator keeps WebApplication, FAQPage and BreadcrumbList through the shared module", async ({
  page,
}) => {
  await page.goto("/tools/ai-savings-estimator");
  const nodes = await jsonLd(page);
  expect(types(nodes)).toEqual(
    expect.arrayContaining(["WebApplication", "BreadcrumbList", "FAQPage"]),
  );
  const app = nodes.find((n) => n["@type"] === "WebApplication")!;
  expect(app.dateModified).toMatch(/T00:00:00-0[45]:00$/);
});

test("every page has a self-referencing absolute canonical", async ({ page }) => {
  for (const route of ["/", "/services", "/about", "/authors/chirag-bansal", "/blog"]) {
    await page.goto(route);
    const href = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(href, route).toMatch(/^https:\/\/sidedataa\.com/);
    expect(new URL(href!).pathname.replace(/\/$/, "") || "/").toBe(route);
  }
});
