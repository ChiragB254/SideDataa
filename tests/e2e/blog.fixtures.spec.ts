import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { JSDOM } from "jsdom";

/**
 * Runs only against the fixture build (BLOG_FIXTURES=1, playwright.fixtures.config.ts).
 * The fixture posts live in tests/fixtures/blog and are never shipped.
 */

const post = "/blog/fixture-rag-evaluation";
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => e.textContent ?? ""));
  return raw.map((r) => JSON.parse(r) as Record<string, unknown>);
}

for (const route of [
  post,
  "/blog/fixture-rag-costs",
  "/blog",
  "/blog/topic/ai",
  "/authors/chirag-bansal",
]) {
  test(`axe, one h1: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}

test("drafts are 404 in production and appear nowhere", async ({ request }) => {
  expect((await request.get("/blog/fixture-draft-secret")).status()).toBe(404);
  for (const p of [
    "/blog",
    "/blog/topic/ai",
    "/authors/chirag-bansal",
    "/sitemap.xml",
    "/feed.xml",
  ]) {
    const body = await (await request.get(p)).text();
    expect(body, p).not.toContain("fixture-draft-secret");
    expect(body, p).not.toContain("unpublished draft");
    expect(body, p).not.toContain("DRAFT-MARKER");
  }
});

test("blog is live: nav link, indexable index, feed link, sitemap entries", async ({
  page,
  request,
}) => {
  await page.goto("/blog");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Blog" }),
  ).toBeVisible();
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute(
    "href",
    "https://sidedataa.com/feed.xml",
  );
  await expect(
    page.getByRole("link", { name: "Fixture post: RAG evaluation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Fixture post: lone web article" }),
  ).toBeVisible();
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
    "https://sidedataa.com/blog",
  );

  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://sidedataa.com/blog</loc>");
  expect(xml).toContain("https://sidedataa.com/blog/fixture-rag-evaluation</loc>");
  expect(xml).toContain("<lastmod>2026-10-25</lastmod>");
  expect(xml).toContain("https://sidedataa.com/blog/topic/ai</loc>");
  expect(xml).not.toContain("/blog/topic/web");
});

test("topic page exists only for topics with two or more posts", async ({
  request,
  page,
}) => {
  expect((await request.get("/blog/topic/web")).status()).toBe(404);
  expect((await request.get("/blog/page/2")).status()).toBe(404);
  await page.goto("/blog/topic/ai");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AI and language models",
  );
  await expect(
    page.getByText(/Articles about building with language models/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Fixture post: second AI article/ }),
  ).toBeVisible();
});

test("post page: byline, dates, TOC landmark, key takeaways, FAQ, sources, editorial note", async ({
  page,
}) => {
  await page.goto(post);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Fixture post: RAG evaluation",
  );
  const byline = page.locator("article header p").last();
  await expect(byline.getByRole("link", { name: "Chirag Bansal" })).toHaveAttribute(
    "href",
    "/authors/chirag-bansal",
  );
  await expect(byline).toContainText("Published 20 October 2026");
  await expect(byline).toContainText("Last updated 25 October 2026");
  await expect(byline).toContainText(/\d+ min read/);
  await expect(byline).toContainText("Reviewed by Test Reviewer");

  const toc = page.getByRole("navigation", { name: "On this page" });
  await expect(toc.getByRole("link")).toHaveText([
    "First section",
    "Code and tables",
    "Questions",
  ]);
  await toc.getByRole("link", { name: "Code and tables" }).click();
  await expect(page).toHaveURL(/#code-and-tables$/);

  await expect(page.getByText("Key takeaways")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What is this page for?" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Example source one" })).toHaveAttribute(
    "href",
    "https://example.com/source-one",
  );
  const note = page.getByRole("complementary", {
    name: "How we write and review our content",
  });
  await expect(note.getByRole("link", { name: "editorial policy" })).toHaveAttribute(
    "href",
    "/about/editorial-policy",
  );
  await expect(page.getByText("Fixture post: second AI article").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Our service: AI development" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "More articles: AI and language models" }),
  ).toBeVisible();

  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs.getByRole("listitem")).toHaveCount(4);
});

test("post without three sections has no table of contents", async ({ page }) => {
  await page.goto("/blog/fixture-rag-costs");
  await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
});

test("post JSON-LD: BlogPosting matches the page, FAQPage matches the visible FAQ", async ({
  page,
}) => {
  await page.goto(post);
  const nodes = await jsonLd(page);
  const article = nodes.find((n) => n["@type"] === "BlogPosting") as {
    headline: string;
    datePublished: string;
    dateModified: string;
    author: { url: string; sameAs: string[] };
    publisher: { name: string };
    mainEntityOfPage: { "@id": string };
  };
  expect(article.headline).toBe(await page.locator("h1").innerText());
  expect(article.datePublished).toBe("2026-10-20T00:00:00-04:00");
  expect(article.dateModified).toBe("2026-10-25T00:00:00-04:00");
  expect(article.author.url).toBe("https://sidedataa.com/authors/chirag-bansal");
  expect(article.author.sameAs).toHaveLength(2);
  expect(article.publisher.name).toBe("SideData Technologies");
  expect(article.mainEntityOfPage["@id"]).toBe("https://sidedataa.com" + post);
  const faq = nodes.find((n) => n["@type"] === "FAQPage") as {
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };
  expect(faq.mainEntity.map((q) => q.name)).toEqual(
    await page.locator("[data-faq-q]").allTextContents(),
  );
  expect(faq.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(
    await page.locator("[data-faq-a]").allTextContents(),
  );
  const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList") as {
    itemListElement: { name: string }[];
  };
  expect(crumbs.itemListElement.map((c) => c.name)).toEqual([
    "Home",
    "Blog",
    "AI and language models",
    "Fixture post: RAG evaluation",
  ]);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "article",
  );
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
    "content",
    "2026-10-20T00:00:00-04:00",
  );
});

test("feed.xml lists the three published fixtures, newest first, and no draft", async ({
  request,
}) => {
  const xml = await (await request.get("/feed.xml")).text();
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
  expect(doc.querySelector("parsererror")).toBeNull();
  const links = [...doc.querySelectorAll("item > link")].map((e) => e.textContent);
  expect(links).toEqual([
    "https://sidedataa.com/blog/fixture-web-single",
    "https://sidedataa.com/blog/fixture-rag-costs",
    "https://sidedataa.com/blog/fixture-rag-evaluation",
  ]);
  expect(xml).toContain("support@sidedataa.com (Chirag Bansal)");
});

test("author page lists the author's published posts", async ({ page }) => {
  await page.goto("/authors/chirag-bansal");
  await expect(
    page.getByRole("link", { name: "Fixture post: RAG evaluation" }),
  ).toBeVisible();
});

for (const width of [320, 390]) {
  test(`code and tables scroll inside focusable regions, no page scroll at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(post);
    const w = await page.evaluate(() => ({
      sw: document.scrollingElement!.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(w.sw).toBeLessThanOrEqual(w.iw);
    const pre = page.locator("pre").first();
    await expect(pre).toHaveAttribute("tabindex", "0");
    expect(await pre.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await pre.focus();
    const outline = await pre.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
    const table = page.locator(".table-scroll").first();
    await expect(table).toHaveAttribute("tabindex", "0");
  });
}

test("target size: links and buttons on the post are at least 24px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(post);
  const small = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(
      document.querySelectorAll<HTMLElement>("a[href], button"),
    )) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (!r.width || !r.height || el.closest("[hidden]")) continue;
      if (el.classList.contains("sr-only-until-focus")) continue;
      if (r.width >= 24 && r.height >= 24) continue;
      if (el.tagName === "A" && st.display === "inline") continue;
      out.push(`${el.textContent?.trim().slice(0, 30)} ${r.width}x${r.height}`);
    }
    return out;
  });
  expect(small).toEqual([]);
});
