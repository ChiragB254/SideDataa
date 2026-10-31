import { describe, expect, it } from "vitest";
import {
  auditPage,
  checkFeed,
  checkRobots,
  formatIssues,
  parseSitemap,
  runChecks,
  type CheckInput,
} from "../../scripts/seo/lib";

const origin = "https://sidedataa.com";

type PageOpts = {
  path?: string;
  title?: string;
  desc?: string;
  canonical?: string | null;
  h1?: string;
  robots?: string;
  jsonld?: unknown[];
  body?: string;
  lang?: string | null;
};

function page(o: PageOpts = {}): string {
  const path = o.path ?? "/a";
  const url = `${origin}${path === "/" ? "" : path}`;
  const desc =
    o.desc ??
    "A sufficiently long description that sits inside the allowed range of lengths.";
  const canon = o.canonical === undefined ? url : o.canonical;
  return `<!DOCTYPE html><html${o.lang === null ? "" : ` lang="${o.lang ?? "en-CA"}"`}><head>
<title>${o.title ?? "Page A | SideData Technologies"}</title>
<meta name="description" content="${desc}"/>
${canon ? `<link rel="canonical" href="${canon}"/>` : ""}
<meta property="og:title" content="t"/><meta property="og:description" content="d"/>
<meta property="og:image" content="${origin}/opengraph-image"/><meta property="og:url" content="${url}"/>
<meta name="twitter:card" content="summary_large_image"/>
${o.robots ? `<meta name="robots" content="${o.robots}"/>` : ""}
${(o.jsonld ?? []).map((j) => `<script type="application/ld+json">${typeof j === "string" ? j : JSON.stringify(j)}</script>`).join("")}
</head><body><h1>${o.h1 ?? "Heading"}</h1>${o.body ?? ""}</body></html>`;
}

const audit = (html: string, path = "/a", routes = new Set(["/a", "/b"])) =>
  auditPage(path, html, { origin, sitemapped: true, routes }).issues;
const rules = (html: string, path?: string) => audit(html, path).map((i) => i.rule);

describe("auditPage", () => {
  it("passes a good page", () => {
    expect(audit(page())).toEqual([]);
  });
  it("flags title, description, canonical, h1, lang and noindex problems", () => {
    expect(rules(page({ title: "x".repeat(80) }))).toContain("title-length");
    expect(rules(page({ desc: "short" }))).toContain("description-length");
    expect(rules(page({ canonical: null }))).toContain("canonical");
    expect(rules(page({ canonical: "/a" }))).toContain("canonical");
    expect(rules(page({ canonical: `${origin}/b` }))).toContain("canonical");
    expect(rules(page({ lang: null }))).toContain("lang");
    expect(rules(page({ robots: "noindex, nofollow" }))).toContain("noindex");
    expect(rules(page().replace("</body>", "<h1>two</h1></body>"))).toContain("h1");
  });
  it("flags missing Open Graph and twitter tags", () => {
    const html = page()
      .replace(/<meta property="og:image"[^>]*>/, "")
      .replace(/<meta name="twitter:card"[^>]*>/, "");
    expect(rules(html)).toEqual(expect.arrayContaining(["open-graph", "twitter"]));
  });
  it("validates JSON-LD", () => {
    expect(rules(page({ jsonld: ["{not json"] }))).toContain("json-ld");
    expect(rules(page({ jsonld: [{ "@type": "Organization", name: "x" }] }))).toContain(
      "json-ld",
    );
    const ok = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "n",
      url: origin,
    };
    expect(audit(page({ jsonld: [ok] }))).toEqual([]);
    expect(rules(page({ jsonld: [{ ...ok, "@type": "Organization" }] }))).toContain(
      "json-ld",
    );
  });
  it("checks FAQPage against the visible FAQ", () => {
    const faq = (q: string, a: string) => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } },
      ],
    });
    const visible =
      "<div data-faq><h3 data-faq-q>Why?</h3><p data-faq-a>Because.</p></div>";
    expect(audit(page({ jsonld: [faq("Why?", "Because.")], body: visible }))).toEqual([]);
    expect(
      rules(page({ jsonld: [faq("Why not?", "Because.")], body: visible })),
    ).toContain("faq");
    expect(rules(page({ jsonld: [faq("Why?", "Different.")], body: visible }))).toContain(
      "faq",
    );
  });
  it("checks that the Article headline equals the h1", () => {
    const art = (headline: string) => ({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      datePublished: "2026-11-02T00:00:00-05:00",
      dateModified: "2026-11-02T00:00:00-05:00",
      author: { "@type": "Person", name: "x" },
      publisher: { "@type": "Organization", name: "x" },
      image: ["https://sidedataa.com/i.png"],
      mainEntityOfPage: "x",
    });
    expect(audit(page({ jsonld: [art("Heading")] }))).toEqual([]);
    expect(rules(page({ jsonld: [art("Other")] }))).toContain("article");
  });
  it("checks that BreadcrumbList matches the visible trail", () => {
    const bc = (names: string[]) => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: names.map((name, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name,
        item: origin,
      })),
    });
    const nav =
      '<nav aria-label="Breadcrumb"><ol><li><a href="/b">Home</a> <span>/</span></li><li>Here</li></ol></nav>';
    expect(audit(page({ jsonld: [bc(["Home", "Here"])], body: nav }))).toEqual([]);
    expect(rules(page({ jsonld: [bc(["Home", "There"])], body: nav }))).toContain(
      "breadcrumb",
    );
  });
  it("flags images without alt, accepts empty alt, and reports broken internal links", () => {
    expect(rules(page({ body: '<img src="/x.png">' }))).toContain("img-alt");
    expect(audit(page({ body: '<img src="/x.png" alt="">' }))).toEqual([]);
    expect(rules(page({ body: '<a href="/missing">x</a>' }))).toContain("broken-link");
    expect(
      audit(
        page({
          body: '<a href="/b#frag">b</a><a href="mailto:a@b.c">m</a><a href="https://example.com/z">e</a>',
        }),
      ),
    ).toEqual([]);
  });
});

describe("checkRobots", () => {
  const good = `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /form-status\n\nUser-Agent: Googlebot\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
  it("requires the sitemap line", () => {
    expect(
      checkRobots(good.replace(/Sitemap:.*/, ""), origin).map((i) => i.detail),
    ).toContain(`missing "Sitemap: ${origin}/sitemap.xml"`);
  });
  it("flags a blocked allowed-bot", () => {
    const text = `${good}\nUser-Agent: OAI-SearchBot\nDisallow: /\n`;
    expect(
      checkRobots(text, origin).some((i) =>
        i.detail.includes("OAI-SearchBot is blocked"),
      ),
    ).toBe(true);
  });
  it("accepts a full policy", () => {
    const bots = [
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
    ];
    const groups = ["*", ...bots]
      .map((b) => `User-Agent: ${b}\nAllow: /\nDisallow: /api/\nDisallow: /form-status\n`)
      .join("\n");
    expect(checkRobots(`${groups}\nSitemap: ${origin}/sitemap.xml\n`, origin)).toEqual(
      [],
    );
  });
});

describe("checkFeed", () => {
  const item = (date: string) =>
    `<item><title>T</title><link>${origin}/blog/t</link><guid>${origin}/blog/t</guid><pubDate>${date}</pubDate><description>d</description></item>`;
  const feed = (items: string) =>
    `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>${origin}/blog</link><description>d</description>${items}</channel></rss>`;
  it("accepts valid RSS", () => {
    expect(checkFeed(feed(item("Tue, 20 Oct 2026 00:00:00 -0400")), origin)).toEqual([]);
  });
  it("flags bad XML and bad dates", () => {
    expect(checkFeed("<rss><channel></rss>", origin)[0]?.rule).toBe("xml");
    expect(
      checkFeed(feed(item("2026-10-20")), origin).some((i) =>
        i.detail.includes("RFC 822"),
      ),
    ).toBe(true);
  });
});

describe("runChecks", () => {
  const sitemap = (...paths: string[]) =>
    `<?xml version="1.0"?><urlset>${paths.map((p) => `<url><loc>${origin}${p === "/" ? "" : p}</loc></url>`).join("")}</urlset>`;
  const robots =
    [
      "*",
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
    ]
      .map((b) => `User-Agent: ${b}\nAllow: /\nDisallow: /api/\nDisallow: /form-status\n`)
      .join("\n") + `\nSitemap: ${origin}/sitemap.xml\n`;
  const base = (): CheckInput => ({
    origin,
    pages: {
      "/a": page({
        path: "/a",
        title: "A | SideData Technologies",
        desc: "Description of page A, long enough to be valid for the checker.",
      }),
      "/b": page({
        path: "/b",
        title: "B | SideData Technologies",
        desc: "Description of page B, long enough to be valid for the checker.",
      }),
    },
    otherRoutes: new Set(),
    sitemapXml: sitemap("/a", "/b"),
    robotsTxt: robots,
    allowFixtures: false,
  });

  it("passes a consistent site", () => {
    expect(runChecks(base()).issues).toEqual([]);
  });
  it("flags a sitemap URL that is not built, and an indexable page missing from the sitemap", () => {
    const input = { ...base(), sitemapXml: sitemap("/a", "/ghost") };
    const found = runChecks(input).issues.map((i) => `${i.page}:${i.rule}`);
    expect(found).toContain("/sitemap.xml:sitemap");
    expect(found).toContain("/b:sitemap");
  });
  it("allows noindex pages outside the sitemap but not inside it", () => {
    const input = base();
    input.pages["/b"] = page({
      path: "/b",
      title: "B | SideData Technologies",
      desc: "Description of page B, long enough to be valid for the checker.",
      robots: "noindex",
    });
    input.sitemapXml = sitemap("/a");
    expect(runChecks(input).issues).toEqual([]);
    input.sitemapXml = sitemap("/a", "/b");
    expect(runChecks(input).issues.map((i) => i.rule)).toContain("noindex");
  });
  it("flags duplicate titles and descriptions", () => {
    const input = base();
    input.pages["/b"] = page({
      path: "/b",
      title: "A | SideData Technologies",
      desc: "Description of page A, long enough to be valid for the checker.",
    });
    const r = runChecks(input).issues.map((i) => i.rule);
    expect(r).toEqual(
      expect.arrayContaining(["duplicate-title", "duplicate-description"]),
    );
  });
  it("flags changefreq/priority and fixture posts in a normal build", () => {
    const input = base();
    input.sitemapXml = input.sitemapXml.replace(
      "</url>",
      "<changefreq>monthly</changefreq></url>",
    );
    input.pages["/blog/fixture-x"] = page({
      path: "/blog/fixture-x",
      title: "F | SideData Technologies",
      desc: "Description of the fixture page, long enough to be valid for the checker.",
    });
    const rs = runChecks(input).issues.map((i) => i.rule);
    expect(rs).toContain("fixture");
    expect(rs).toContain("sitemap");
  });
  it("formats a readable table", () => {
    const out = formatIssues([
      { page: "/a", rule: "h1", detail: "expected exactly 1 <h1>" },
    ]);
    expect(out.split("\n")[0]).toMatch(/PAGE\s+RULE\s+PROBLEM/);
    expect(parseSitemap(sitemap("/a"))).toHaveLength(1);
  });
});
