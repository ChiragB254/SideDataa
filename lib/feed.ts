import { getAuthor } from "./authors";
import type { Post } from "./blog";
import { rfc822 } from "./dates";
import { isoWithOffset } from "./jsonld";
import { absoluteUrl, seo } from "./seo";
import { site } from "./site";

export function escapeXml(s: string): string {
  return (
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      // Characters that are not allowed in XML 1.0.
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  );
}

/** RSS 2.0 feed of the given (already published) posts, newest first. */
export function buildFeed(posts: Post[]): string {
  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      const author = getAuthor(p.author);
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${rfc822(isoWithOffset(p.datePublished))}</pubDate>`,
        `      <description>${escapeXml(p.description)}</description>`,
        author
          ? `      <author>${escapeXml(`${site.email} (${author.name})`)}</author>`
          : "",
        author ? `      <dc:creator>${escapeXml(author.name)}</dc:creator>` : "",
        `      <category>${escapeXml(p.topic)}</category>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const newest = posts
    .map((p) => isoWithOffset(p.dateModified))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${site.name} blog`)}</title>
    <link>${escapeXml(absoluteUrl("/blog"))}</link>
    <description>${escapeXml(`Articles from ${site.name} on AI, web development, servers, cloud and IT.`)}</description>
    <language>${seo.locale.toLowerCase()}</language>
    <atom:link href="${escapeXml(absoluteUrl(seo.feedPath))}" rel="self" type="application/rss+xml"/>${
      newest ? `\n    <lastBuildDate>${rfc822(newest)}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;
}
