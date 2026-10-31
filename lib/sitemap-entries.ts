import { editorialPolicy } from "@/content/editorial";
import { estimatorPage } from "@/content/estimator";
import { services } from "@/content/services";
import { authors, authorPath } from "./authors";
import {
  getHubTopics,
  getPostsByTopic,
  latestModified,
  pageCount,
  postPath,
  type Post,
} from "./blog";
import { absoluteUrl } from "./seo";

export type Entry = { url: string; lastModified?: string };

/**
 * Every indexable page. `lastModified` comes only from real data (a post's dateModified,
 * the estimator's or policy's own updated/reviewed date); pages without one omit it.
 * Never use the build time. Noindex pages (person cards, form status, the empty blog,
 * 404) are not listed. `posts` must already exclude drafts.
 */
export function sitemapEntries(posts: Post[]): Entry[] {
  const e = (path: string, lastModified?: string): Entry => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
  });

  const entries: Entry[] = [
    e("/"),
    e("/services"),
    ...services.map((s) => e(`/services/${s.slug}`)),
    e("/tools", estimatorPage.updatedISO),
    e(estimatorPage.path, estimatorPage.updatedISO),
    e("/about"),
    e(editorialPolicy.path, editorialPolicy.reviewedISO),
    ...Object.values(authors).map((a) => e(authorPath(a))),
    e("/careers"),
    e("/contact"),
    e("/card"),
    e("/privacy"),
    e("/terms"),
    e("/accessibility"),
  ];

  // The blog appears only once something is published.
  if (posts.length) {
    entries.push(e("/blog", latestModified(posts)));
    for (let n = 2; n <= pageCount(posts.length); n++) entries.push(e(`/blog/page/${n}`));
    for (const t of getHubTopics(posts)) {
      entries.push(
        e(`/blog/topic/${t.slug}`, latestModified(getPostsByTopic(t.slug, posts))),
      );
    }
    for (const p of posts) entries.push(e(postPath(p), p.dateModified));
  }
  return entries;
}
