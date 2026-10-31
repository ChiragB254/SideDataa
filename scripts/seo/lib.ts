import { JSDOM } from "jsdom";

/**
 * Pure SEO checks over prerendered HTML and the sitemap/robots/feed outputs. No browser:
 * HTML is parsed with jsdom (scripts are never executed). scripts/seo/check.ts reads the
 * build output from disk and calls runChecks(); unit tests call it with small fixtures.
 */

export type Issue = { page: string; rule: string; detail: string };

export type CheckInput = {
  /** Expected site origin, e.g. https://sidedataa.com (no trailing slash). */
  origin: string;
  /** Prerendered pages keyed by path ("/", "/services"). Excludes the 404 page. */
  pages: Record<string, string>;
  /** Routes that exist but are not prerendered HTML (route handlers, dynamic routes, public files). */
  otherRoutes: Set<string>;
  sitemapXml: string;
  robotsTxt: string;
  feedXml?: string;
  /** When false, any fixture post (slug starting "fixture-") in the build is an error. */
  allowFixtures: boolean;
};

export const ALLOWED_BOTS = [
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

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const trimSlash = (u: string) => (u.length > 1 ? u.replace(/\/+$/, "") : u);

export function pathOf(url: string, origin: string): string | null {
  if (!url.startsWith(origin)) return null;
  const rest = url.slice(origin.length) || "/";
  return trimSlash(rest.split(/[?#]/)[0] || "/");
}

export function parseSitemap(
  xml: string,
): { loc: string; lastmod?: string; extra: string[] }[] {
  const out: { loc: string; lastmod?: string; extra: string[] }[] = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const body = m[1] ?? "";
    const loc = /<loc>([^<]+)<\/loc>/.exec(body)?.[1]?.trim();
    if (!loc) continue;
    const extra = ["changefreq", "priority"].filter((t) => body.includes(`<${t}>`));
    out.push({
      loc,
      lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(body)?.[1]?.trim(),
      extra,
    });
  }
  return out;
}

/** Required properties per JSON-LD @type (a schema-ish sanity check, not full schema.org). */
export const REQUIRED: Record<string, string[]> = {
  Organization: ["name", "url", "logo"],
  WebSite: ["name", "url"],
  BreadcrumbList: ["itemListElement"],
  Service: ["name", "serviceType", "provider"],
  BlogPosting: [
    "headline",
    "datePublished",
    "dateModified",
    "author",
    "publisher",
    "image",
    "mainEntityOfPage",
  ],
  Person: ["name", "url"],
  ProfilePage: ["mainEntity"],
  FAQPage: ["mainEntity"],
  WebApplication: ["name", "url", "applicationCategory", "operatingSystem"],
};

const OFFSET_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function validateNode(node: unknown, path = "$"): string[] {
  const errs: string[] = [];
  if (!node || typeof node !== "object") return errs;
  if (Array.isArray(node)) {
    node.forEach((n, i) => errs.push(...validateNode(n, `${path}[${i}]`)));
    return errs;
  }
  const o = node as Record<string, unknown>;
  const types = ([] as unknown[]).concat(o["@type"] ?? []).map(String);
  for (const t of types) {
    // Required properties are enforced on top-level nodes; nested ones are references.
    for (const prop of path === "$" ? (REQUIRED[t] ?? []) : []) {
      // A bare {"@id": ...} reference is allowed for provider/publisher-style fields.
      if (o[prop] === undefined || o[prop] === "")
        errs.push(`${path} (${t}) is missing "${prop}"`);
    }
    if (t === "BlogPosting") {
      for (const d of ["datePublished", "dateModified"]) {
        if (typeof o[d] === "string" && !OFFSET_DATE.test(o[d] as string)) {
          errs.push(`${path} ${d} "${String(o[d])}" lacks a time zone offset`);
        }
      }
    }
  }
  if (o.aggregateRating || o.review)
    errs.push(`${path} self-serving review/rating markup is not allowed`);
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object") errs.push(...validateNode(v, `${path}.${k}`));
  }
  return errs;
}

function metaContent(doc: Document, sel: string): string | undefined {
  return doc.querySelector(sel)?.getAttribute("content")?.trim() ?? undefined;
}

export type PageInfo = {
  title?: string;
  description?: string;
  noindex: boolean;
  /** True when the canonical points at another page (a duplicate view). */
  canonicalElsewhere: boolean;
};

export function auditPage(
  path: string,
  html: string,
  opts: { origin: string; sitemapped: boolean; routes: Set<string> },
): { issues: Issue[]; info: PageInfo } {
  const issues: Issue[] = [];
  const add = (rule: string, detail: string) => issues.push({ page: path, rule, detail });
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const robots = metaContent(doc, 'meta[name="robots"]') ?? "";
  const noindex = /noindex/i.test(robots);
  const titles = doc.querySelectorAll("head title");
  const title = titles[0]?.textContent?.trim();
  const description = metaContent(doc, 'meta[name="description"]');
  const canonHref =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
  const info: PageInfo = {
    title,
    description,
    noindex,
    canonicalElsewhere: !!canonHref && pathOf(canonHref, opts.origin) !== path,
  };

  if (!doc.documentElement.getAttribute("lang"))
    add("lang", "<html> has no lang attribute");

  if (opts.sitemapped) {
    if (noindex) add("noindex", "page is in the sitemap but has noindex");
    if (titles.length !== 1)
      add("title", `expected exactly 1 <title>, found ${titles.length}`);
    else if (!title) add("title", "empty <title>");
    else if (title.length > 65)
      add("title-length", `${title.length} chars (max 65): "${title}"`);
    if (!description) add("description", "missing meta description");
    else if (description.length < 50 || description.length > 160) {
      add("description-length", `${description.length} chars (want 50-160)`);
    }

    const canon = doc.querySelectorAll('link[rel="canonical"]');
    if (canon.length !== 1)
      add("canonical", `expected 1 canonical, found ${canon.length}`);
    else {
      const href = canon[0]?.getAttribute("href") ?? "";
      if (!href.startsWith("https://"))
        add("canonical", `not an absolute https URL: ${href}`);
      else if (pathOf(href, opts.origin) !== path) {
        add("canonical", `not self-referencing: ${href} (page is ${path})`);
      }
    }

    for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
      if (!metaContent(doc, `meta[property="${p}"]`)) add("open-graph", `missing ${p}`);
    }
    const ogUrl = metaContent(doc, 'meta[property="og:url"]');
    if (ogUrl && pathOf(ogUrl, opts.origin) !== path)
      add("open-graph", `og:url ${ogUrl} is not this page`);
    const ogImage = metaContent(doc, 'meta[property="og:image"]');
    if (ogImage && !ogImage.startsWith("https://"))
      add("open-graph", `og:image not absolute: ${ogImage}`);
    if (!metaContent(doc, 'meta[name="twitter:card"]'))
      add("twitter", "missing twitter:card");
  }

  const h1s = doc.querySelectorAll("h1");
  if (h1s.length !== 1) add("h1", `expected exactly 1 <h1>, found ${h1s.length}`);

  // JSON-LD
  const blocks = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  const nodes: Record<string, unknown>[] = [];
  blocks.forEach((b, i) => {
    try {
      const data = JSON.parse(b.textContent ?? "") as Record<string, unknown>;
      const list = (Array.isArray(data["@graph"]) ? data["@graph"] : [data]) as Record<
        string,
        unknown
      >[];
      if (!data["@context"]) add("json-ld", `block ${i + 1} has no @context`);
      for (const n of list) {
        if (!n["@type"]) add("json-ld", `block ${i + 1} has no @type`);
        for (const e of validateNode(n)) add("json-ld", `block ${i + 1}: ${e}`);
        nodes.push(n);
      }
    } catch (e) {
      add("json-ld", `block ${i + 1} is not valid JSON: ${(e as Error).message}`);
    }
  });
  const typeOf = (n: Record<string, unknown>) =>
    ([] as unknown[]).concat(n["@type"] ?? []).map(String);

  // JSON-LD must match visible content.
  for (const n of nodes.filter((x) => typeOf(x).includes("FAQPage"))) {
    const jq = (
      n.mainEntity as { name: string; acceptedAnswer?: { text: string } }[]
    ).map((q) => ({
      q: norm(q.name),
      a: norm(q.acceptedAnswer?.text ?? ""),
    }));
    const vq = [...doc.querySelectorAll("[data-faq-q]")].map((e) =>
      norm(e.textContent ?? ""),
    );
    const va = [...doc.querySelectorAll("[data-faq-a]")].map((e) =>
      norm(e.textContent ?? ""),
    );
    if (JSON.stringify(jq.map((x) => x.q)) !== JSON.stringify(vq)) {
      add(
        "faq",
        `FAQPage questions differ from the visible FAQ (json-ld ${jq.length}, visible ${vq.length})`,
      );
    } else if (JSON.stringify(jq.map((x) => x.a)) !== JSON.stringify(va)) {
      add("faq", "FAQPage answers differ from the visible FAQ text");
    }
  }
  for (const n of nodes.filter((x) => typeOf(x).includes("BlogPosting"))) {
    const h1 = norm(h1s[0]?.textContent ?? "");
    if (norm(String(n.headline ?? "")) !== h1)
      add("article", `headline "${String(n.headline)}" does not match h1 "${h1}"`);
  }
  const crumbs = nodes.find((x) => typeOf(x).includes("BreadcrumbList"));
  if (crumbs) {
    const names = (crumbs.itemListElement as { name: string }[]).map((c) => norm(c.name));
    const visible = [...doc.querySelectorAll('nav[aria-label="Breadcrumb"] li')].map(
      (e) => norm((e.textContent ?? "").replace(/\s*\/\s*$/, "")),
    );
    if (JSON.stringify(names) !== JSON.stringify(visible)) {
      add(
        "breadcrumb",
        `BreadcrumbList [${names.join(" > ")}] differs from visible [${visible.join(" > ")}]`,
      );
    }
  }

  // Images need alt (empty alt marks them decorative).
  doc.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt"))
      add("img-alt", `<img src="${img.getAttribute("src") ?? ""}"> has no alt attribute`);
  });

  // Internal links must resolve to a built route.
  const seen = new Set<string>();
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    let p: string;
    if (href.startsWith("/")) p = trimSlash(href.split(/[?#]/)[0] || "/");
    else if (href.startsWith(opts.origin)) p = pathOf(href, opts.origin) ?? "/";
    else return;
    if (seen.has(p)) return;
    seen.add(p);
    if (!opts.routes.has(p)) add("broken-link", `${href} does not match any built route`);
  });

  return { issues, info };
}

export function checkRobots(text: string, origin: string): Issue[] {
  const issues: Issue[] = [];
  const add = (detail: string) =>
    issues.push({ page: "/robots.txt", rule: "robots", detail });
  if (
    !new RegExp(
      `^Sitemap:\\s*${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml\\s*$`,
      "im",
    ).test(text)
  ) {
    add(`missing "Sitemap: ${origin}/sitemap.xml"`);
  }
  // Parse groups.
  const groups: { agents: string[]; rules: { type: string; value: string }[] }[] = [];
  let cur: (typeof groups)[number] | undefined;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = (m[1] ?? "").toLowerCase();
    const val = m[2] ?? "";
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if (key === "allow" || key === "disallow") {
      cur?.rules.push({ type: key, value: val });
      lastWasAgent = false;
    }
  }
  const blocked = (agent: string, p: string): boolean => {
    const g =
      groups.find((x) => x.agents.includes(agent.toLowerCase())) ??
      groups.find((x) => x.agents.includes("*"));
    if (!g) return false;
    let best: { len: number; allow: boolean } | undefined;
    for (const r of g.rules) {
      if (r.value === "" || !p.startsWith(r.value)) continue;
      const len = r.value.length;
      if (!best || len > best.len || (len === best.len && r.type === "allow"))
        best = { len, allow: r.type === "allow" };
    }
    return best ? !best.allow : false;
  };
  for (const bot of ALLOWED_BOTS) {
    for (const p of ["/", "/services", "/blog"]) {
      if (blocked(bot, p)) add(`${bot} is blocked from ${p}`);
    }
    if (!blocked(bot, "/api/contact"))
      add(`${bot} is allowed into /api/ (should be disallowed)`);
  }
  if (!blocked("*", "/form-status")) add("/form-status is not disallowed for *");
  return issues;
}

export function checkXml(xml: string, name: string): Issue | null {
  try {
    const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
    if (doc.querySelector("parsererror")) throw new Error("parser error");
    return null;
  } catch (e) {
    return {
      page: name,
      rule: "xml",
      detail: `not well-formed XML: ${(e as Error).message}`,
    };
  }
}

const RFC822 =
  /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} ([+-]\d{4}|GMT)$/;

export function checkFeed(xml: string, origin: string): Issue[] {
  const bad = checkXml(xml, "/feed.xml");
  if (bad) return [bad];
  const issues: Issue[] = [];
  const add = (detail: string) =>
    issues.push({ page: "/feed.xml", rule: "feed", detail });
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
  const rss = doc.documentElement;
  if (rss.localName !== "rss" || rss.getAttribute("version") !== "2.0")
    add('root must be <rss version="2.0">');
  for (const t of ["title", "link", "description"]) {
    if (!doc.querySelector(`channel > ${t}`)) add(`channel is missing <${t}>`);
  }
  doc.querySelectorAll("item").forEach((item, i) => {
    const get = (t: string) => item.getElementsByTagName(t)[0]?.textContent?.trim() ?? "";
    if (!get("title")) add(`item ${i + 1} has no title`);
    if (!get("link").startsWith(`${origin}/`))
      add(`item ${i + 1} link is not absolute: ${get("link")}`);
    if (!get("guid")) add(`item ${i + 1} has no guid`);
    if (!RFC822.test(get("pubDate")))
      add(`item ${i + 1} pubDate is not RFC 822: "${get("pubDate")}"`);
    if (!get("description")) add(`item ${i + 1} has no description`);
  });
  return issues;
}

export function runChecks(input: CheckInput): { issues: Issue[]; pageCount: number } {
  const { origin } = input;
  const issues: Issue[] = [];
  const entries = parseSitemap(input.sitemapXml);
  const bad = checkXml(input.sitemapXml, "/sitemap.xml");
  if (bad) issues.push(bad);

  const sitemapPaths = new Set<string>();
  for (const e of entries) {
    const p = pathOf(e.loc, origin);
    if (p === null) {
      issues.push({
        page: "/sitemap.xml",
        rule: "sitemap",
        detail: `${e.loc} is not on ${origin}`,
      });
      continue;
    }
    if (sitemapPaths.has(p))
      issues.push({ page: "/sitemap.xml", rule: "sitemap", detail: `duplicate ${p}` });
    sitemapPaths.add(p);
    if (e.extra.length)
      issues.push({
        page: "/sitemap.xml",
        rule: "sitemap",
        detail: `${p} has ${e.extra.join("/")} (not used)`,
      });
    if (!(p in input.pages))
      issues.push({
        page: "/sitemap.xml",
        rule: "sitemap",
        detail: `${p} is not a built page`,
      });
  }

  const routes = new Set<string>([...Object.keys(input.pages), ...input.otherRoutes]);
  const infos: Record<string, PageInfo> = {};
  for (const [path, html] of Object.entries(input.pages)) {
    const sitemapped = sitemapPaths.has(path);
    const r = auditPage(path, html, { origin, sitemapped, routes });
    issues.push(...r.issues);
    infos[path] = r.info;
    if (!sitemapped && !r.info.noindex && !r.info.canonicalElsewhere) {
      issues.push({
        page: path,
        rule: "sitemap",
        detail: "indexable page is missing from the sitemap (add it, or mark it noindex)",
      });
    }
    if (!input.allowFixtures && /^\/blog\/fixture-/.test(path)) {
      issues.push({
        page: path,
        rule: "fixture",
        detail: "fixture post found in a build without BLOG_FIXTURES=1",
      });
    }
  }

  // Duplicate titles / descriptions among indexable pages.
  for (const field of ["title", "description"] as const) {
    const by = new Map<string, string[]>();
    for (const p of sitemapPaths) {
      const v = infos[p]?.[field];
      if (v) by.set(v, [...(by.get(v) ?? []), p]);
    }
    for (const [v, ps] of by) {
      if (ps.length > 1)
        issues.push({
          page: ps.join(", "),
          rule: `duplicate-${field}`,
          detail: `"${v.slice(0, 70)}"`,
        });
    }
  }

  issues.push(...checkRobots(input.robotsTxt, origin));
  if (input.feedXml !== undefined) issues.push(...checkFeed(input.feedXml, origin));
  return { issues, pageCount: Object.keys(input.pages).length };
}

export function formatIssues(issues: Issue[]): string {
  if (!issues.length) return "";
  const w1 = Math.min(40, Math.max(4, ...issues.map((i) => i.page.length)));
  const w2 = Math.max(4, ...issues.map((i) => i.rule.length));
  const row = (a: string, b: string, c: string) =>
    `${a.slice(0, w1).padEnd(w1)}  ${b.padEnd(w2)}  ${c}`;
  return [
    row("PAGE", "RULE", "PROBLEM"),
    row("-".repeat(w1), "-".repeat(w2), "-".repeat(7)),
    ...issues.map((i) => row(i.page, i.rule, i.detail)),
  ].join("\n");
}
