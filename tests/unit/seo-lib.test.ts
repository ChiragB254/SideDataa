import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authors } from "@/lib/authors";
import { loadPostsFromDir, paginate, pageCount, parsePost } from "@/lib/blog";
import { buildFeed } from "@/lib/feed";
import {
  article,
  breadcrumbList,
  faqPage,
  isoWithOffset,
  organization,
  person,
  profilePage,
  service,
  webApplication,
  website,
} from "@/lib/jsonld";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { sitemapEntries } from "@/lib/sitemap-entries";
import { validateNode } from "../../scripts/seo/lib";

const chirag = authors["chirag-bansal"]!;
const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "blog");
const fixtures = () => loadPostsFromDir(fixtureDir, true);

afterEach(() => vi.unstubAllEnvs());

describe("pageMetadata", () => {
  const m = pageMetadata({
    title: "Services",
    description: "A description.",
    path: "/services",
  });

  it("sets an absolute self-referencing canonical", () => {
    expect(m.alternates?.canonical).toBe("https://sidedataa.com/services");
  });
  it("builds a full openGraph and twitter object (children replace the parent's)", () => {
    expect(m.openGraph).toMatchObject({
      type: "website",
      siteName: "SideData Technologies",
      title: "Services | SideData Technologies",
      url: "https://sidedataa.com/services",
    });
    expect(m.openGraph && "images" in m.openGraph && m.openGraph.images).toBeTruthy();
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });
  it("is indexable by default and noindex on request", () => {
    expect(m.robots).toBeUndefined();
    expect(
      pageMetadata({ title: "x", description: "y", path: "/x", noindex: true }).robots,
    ).toEqual({
      index: false,
      follow: false,
    });
  });
  it("omits images for routes with their own opengraph-image", () => {
    const own = pageMetadata({
      title: "x",
      description: "y",
      path: "/x",
      ownImage: true,
    });
    expect(own.openGraph && "images" in own.openGraph).toBe(false);
  });
  it("adds article fields only when given", () => {
    const a = pageMetadata({
      title: "x",
      description: "y",
      path: "/blog/x",
      publishedTime: "2026-11-02T00:00:00-05:00",
      modifiedTime: "2026-11-03T00:00:00-05:00",
      authors: ["https://sidedataa.com/authors/chirag-bansal"],
    });
    expect(a.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-11-02T00:00:00-05:00",
      authors: ["https://sidedataa.com/authors/chirag-bansal"],
    });
  });
  it("builds absolute URLs", () => {
    expect(absoluteUrl("/")).toBe("https://sidedataa.com");
    expect(absoluteUrl("/a")).toBe("https://sidedataa.com/a");
  });
});

describe("isoWithOffset", () => {
  it("uses the Toronto offset for the day", () => {
    expect(isoWithOffset("2026-01-15")).toBe("2026-01-15T00:00:00-05:00");
    expect(isoWithOffset("2026-07-15")).toBe("2026-07-15T00:00:00-04:00");
  });
  it("is correct on daylight-saving change days", () => {
    expect(isoWithOffset("2026-03-08")).toBe("2026-03-08T00:00:00-05:00");
    expect(isoWithOffset("2026-11-01")).toBe("2026-11-01T00:00:00-04:00");
  });
  it("keeps values that already have an offset", () => {
    expect(isoWithOffset("2026-01-15T10:00:00+01:00")).toBe("2026-01-15T10:00:00+01:00");
  });
});

describe("JSON-LD builders", () => {
  const nodes = {
    organization: organization(),
    website: website(),
    breadcrumb: breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]),
    service: service({
      name: "AI development",
      serviceType: "AI development",
      description: "d",
      path: "/services/ai-development",
    }),
    article: article({
      headline: "H",
      description: "d",
      path: "/blog/h",
      datePublished: "2026-11-02",
      dateModified: "2026-11-03",
      author: chirag,
      image: "/opengraph-image",
    }),
    person: person(chirag),
    profile: profilePage(chirag),
    faq: faqPage([{ q: "Q?", a: "A." }]),
    app: webApplication({
      name: "T",
      path: "/tools/t",
      description: "d",
      dateModified: "2026-10-31",
      author: chirag,
    }),
  };

  for (const [name, node] of Object.entries(nodes)) {
    it(`${name} has @context, @type and its required properties`, () => {
      expect(node["@context"]).toBe("https://schema.org");
      expect(node["@type"]).toBeTruthy();
      expect(validateNode(node)).toEqual([]);
    });
  }

  it("Organization has no sameAs, ratings, reviews or founding date", () => {
    const o = nodes.organization;
    for (const k of ["sameAs", "aggregateRating", "review", "foundingDate"])
      expect(o).not.toHaveProperty(k);
    expect(o.logo).toMatch(/^https:\/\/.+\.png$/);
    expect(o.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Toronto",
      addressRegion: "Ontario",
      addressCountry: "CA",
    });
  });
  it("Service omits areaServed and any price", () => {
    expect(nodes.service).not.toHaveProperty("areaServed");
    expect(JSON.stringify(nodes.service)).not.toMatch(/price|offers/i);
  });
  it("Article carries offsets, author url and sameAs, publisher and image", () => {
    const a = nodes.article as Record<
      string,
      Record<string, unknown> | string | unknown[]
    > & {
      author: { url: string; sameAs: string[] };
      publisher: { name: string };
      image: string[];
      datePublished: string;
    };
    expect(a.datePublished).toBe("2026-11-02T00:00:00-05:00");
    expect(a.author.url).toBe("https://sidedataa.com/authors/chirag-bansal");
    expect(a.author.sameAs).toEqual([chirag.linkedin, chirag.github]);
    expect(a.publisher.name).toBe("SideData Technologies");
    expect(a.image[0]).toBe("https://sidedataa.com/opengraph-image");
  });
  it("Person uses the approved bio verbatim and the two allowed links", () => {
    const p = nodes.person as {
      description: string;
      jobTitle: string;
      sameAs: string[];
      hasCredential: { name: string };
    };
    expect(p.description).toBe(chirag.bio);
    expect(p.jobTitle).toBe("CEO");
    expect(p.sameAs).toEqual([
      "https://www.linkedin.com/in/chiragb254/",
      "https://github.com/ChiragB254",
    ]);
    expect(p.hasCredential.name).toBe("Google Cloud Certified: Generative AI Leader");
    expect(JSON.stringify(p)).not.toMatch(/employer|formerly/i);
  });
  it("the checker flags rating markup and a date without an offset", () => {
    expect(
      validateNode({ "@type": "Organization", aggregateRating: {} }).length,
    ).toBeGreaterThan(0);
    expect(
      validateNode({ ...(nodes.article as object), datePublished: "2026-11-02" }).join(),
    ).toContain("time zone offset");
  });
});

describe("markdown", () => {
  it("renders ids, key takeaways, callouts, faq, scrollable code and tables", () => {
    const r = renderMarkdown(
      [
        ":::takeaways",
        "- one",
        ":::",
        "## Alpha Beta",
        "text",
        "## Alpha Beta",
        "```ts",
        "const a = '<b>';",
        "```",
        "| a | b |",
        "| - | - |",
        "| 1 | 2 |",
        ":::callout caution Heads up",
        "careful",
        ":::",
        ":::faq",
        "### Why?",
        "Because **reasons**.",
        ":::",
      ].join("\n"),
    );
    expect(r.headings.map((h) => h.id)).toEqual(["alpha-beta", "alpha-beta-2"]);
    const html = r.segments.map((s) => ("html" in s ? s.html : "")).join("");
    expect(html).toContain('<pre tabindex="0"');
    expect(html).toContain('class="table-scroll" tabindex="0"');
    expect(html).toContain("&lt;b&gt;");
    expect(r.segments.map((s) => s.type)).toEqual(["takeaways", "md", "callout", "faq"]);
    expect(r.faq).toEqual([
      { q: "Why?", aHtml: expect.any(String), aText: "Because reasons." },
    ]);
  });
  it("escapes raw HTML and rejects h1, images and unknown blocks", () => {
    const html = renderMarkdown("<script>alert(1)</script>")
      .segments.map((s) => ("html" in s ? s.html : ""))
      .join("");
    expect(html).not.toContain("<script>");
    expect(() => renderMarkdown("# Title")).toThrow(/h1/);
    expect(() => renderMarkdown("![x](/a.png)")).toThrow(/images/);
    expect(() => renderMarkdown(":::nope\nx\n:::")).toThrow(/unknown block/);
    expect(() => renderMarkdown(":::faq\n### Q\nA")).toThrow(/never closed/);
  });
});

describe("blog frontmatter", () => {
  const base = (extra = "") =>
    `---\ntitle: T\ndescription: D\nslug: a-post\ntopic: ai\nauthor: chirag-bansal\ndatePublished: 2026-11-02\n${extra}---\nBody text here.\n`;
  it("accepts a minimal post and defaults draft to false", () => {
    const p = parsePost(base(), "a-post.md");
    expect(p.draft).toBe(false);
    expect(p.dateModified).toBe("2026-11-02");
    expect(p.readingMinutes).toBe(1);
  });
  it("rejects bad input with the file name", () => {
    expect(() => parsePost(base(), "other.md")).toThrow(/must match the file name/);
    expect(() =>
      parsePost(base().replace("topic: ai", "topic: nope"), "a-post.md"),
    ).toThrow(/unknown topic/);
    expect(() =>
      parsePost(base().replace("chirag-bansal", "someone"), "a-post.md"),
    ).toThrow(/unknown author/);
    expect(() => parsePost(base("dateModified: 2026-10-01\n"), "a-post.md")).toThrow(
      /earlier/,
    );
    expect(() => parsePost(base("draft: yes please\n"), "a-post.md")).toThrow(/draft/);
    expect(() => parsePost("no frontmatter", "a-post.md")).toThrow(/frontmatter/);
  });
});

describe("blog publishing rules", () => {
  it("the shipped content/blog folder has no posts", () => {
    expect(loadPostsFromDir(path.join(process.cwd(), "content", "blog"))).toEqual([]);
  });

  it("without BLOG_FIXTURES nothing is published", async () => {
    vi.resetModules();
    const blog = await import("@/lib/blog");
    expect(blog.getPublishedPosts()).toEqual([]);
    expect(blog.hasPublishedPosts()).toBe(false);
    expect(blog.getHubTopics()).toEqual([]);
  });

  it("drafts never reach published lists, routes, hubs, sitemap or feed", async () => {
    vi.stubEnv("BLOG_FIXTURES", "1");
    vi.resetModules();
    const blog = await import("@/lib/blog");
    const published = blog.getPublishedPosts();
    const slugs = published.map((p) => p.slug);
    expect(slugs).not.toContain("fixture-draft-secret");
    expect(blog.getRoutablePosts().map((p) => p.slug)).not.toContain(
      "fixture-draft-secret",
    );
    expect(blog.getPostBySlug("fixture-draft-secret")).toBeUndefined();
    expect(blog.getPostsByTopic("ai").map((p) => p.slug)).not.toContain(
      "fixture-draft-secret",
    );
    expect(JSON.stringify(sitemapEntries(published))).not.toContain("draft-secret");
    expect(buildFeed(published)).not.toContain("draft-secret");
    expect(buildFeed(published)).not.toContain("DRAFT-MARKER");
  });

  it("only topics with two or more posts get a hub; related posts share a topic", async () => {
    vi.stubEnv("BLOG_FIXTURES", "1");
    vi.resetModules();
    const blog = await import("@/lib/blog");
    expect(blog.getHubTopics().map((t) => t.slug)).toEqual(["ai"]);
    const first = blog.getPostBySlug("fixture-rag-evaluation")!;
    expect(blog.getRelatedPosts(first).map((p) => p.slug)).toEqual(["fixture-rag-costs"]);
    expect(blog.getRelatedPosts(blog.getPostBySlug("fixture-web-single")!)).toEqual([]);
  });

  it("paginates by ten", () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(10)).toBe(1);
    expect(pageCount(11)).toBe(2);
    expect(paginate(items, 3)).toEqual([20, 21, 22]);
  });
});

describe("sitemap entries", () => {
  it("has no blog entries and no dates from the build clock when nothing is published", () => {
    const e = sitemapEntries([]);
    expect(e.some((x) => x.url.includes("/blog"))).toBe(false);
    expect(e.some((x) => x.url.includes("/card/chirag-bansal"))).toBe(false);
    expect(e.find((x) => x.url.endsWith("/services"))?.lastModified).toBeUndefined();
    expect(
      e.find((x) => x.url.endsWith("/tools/ai-savings-estimator"))?.lastModified,
    ).toBe("2026-10-31");
  });
  it("uses each post's dateModified and lists the hub", () => {
    const published = fixtures().filter((p) => !p.draft);
    const e = sitemapEntries(published);
    expect(
      e.find((x) => x.url.endsWith("/blog/fixture-rag-evaluation"))?.lastModified,
    ).toBe("2026-10-25");
    expect(e.find((x) => x.url.endsWith("/blog/topic/ai"))?.lastModified).toBe(
      "2026-10-25",
    );
    expect(e.some((x) => x.url.endsWith("/blog/topic/web"))).toBe(false);
    expect(e.find((x) => x.url.endsWith("/blog"))?.lastModified).toBe("2026-10-25");
  });
});

describe("feed", () => {
  const published = fixtures().filter((p) => !p.draft);
  const xml = buildFeed(published);
  it("is RSS 2.0 with absolute links, RFC 822 dates and the author", () => {
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(
      "<link>https://sidedataa.com/blog/fixture-rag-evaluation</link>",
    );
    expect(xml).toMatch(/<pubDate>Tue, 20 Oct 2026 00:00:00 -0400<\/pubDate>/);
    expect(xml).toContain("<author>support@sidedataa.com (Chirag Bansal)</author>");
  });
  it("escapes XML special characters", () => {
    const p = { ...published[0]!, title: 'A & B <c> "d"' };
    expect(buildFeed([p])).toContain("<title>A &amp; B &lt;c&gt; &quot;d&quot;</title>");
  });
  it("is valid with zero posts", () => {
    expect(buildFeed([])).toContain("<channel>");
  });
});
