import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { MIN_POSTS_FOR_HUB, getTopic, topics, type Topic } from "@/content/blog-topics";
import { getAuthor, type Author } from "./authors";
import { renderMarkdown, type RenderedMarkdown } from "./markdown";

/**
 * Blog engine. Posts are Markdown files in content/blog/<slug>.md with YAML frontmatter
 * (see docs/seo/IMPLEMENTATION.md). Everything here runs at build time.
 *
 * Drafts (`draft: true`) are never returned by the public getters, so they cannot reach
 * the index, topic pages, sitemap, feed, author page, static params or the nav. In
 * `next dev` only, getPostBySlug/getRoutablePosts also return drafts so an author can
 * preview them; they are always noindex.
 *
 * Test fixtures: when BLOG_FIXTURES=1 the posts in tests/fixtures/blog are added.
 * Production builds never set it, and `npm run seo:check` fails if fixture posts are
 * found in a build unless that variable is set.
 */

export const POSTS_PER_PAGE = 10;
export const WORDS_PER_MINUTE = 220;
export const FIXTURE_SLUG_PREFIX = "fixture-";

export type PostSource = { title: string; url: string };

export type PostMeta = {
  title: string;
  description: string;
  slug: string;
  topic: string;
  tags: string[];
  author: string;
  /** ISO date (YYYY-MM-DD) or date-time with offset. Dates are never changed automatically. */
  datePublished: string;
  dateModified: string;
  draft: boolean;
  reviewedBy?: string;
  sources: PostSource[];
};

export type Post = PostMeta & {
  body: string;
  wordCount: number;
  readingMinutes: number;
  fixture: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function str(v: unknown, field: string, file: string, max?: number): string {
  if (typeof v !== "string" || !v.trim())
    throw new Error(`${file}: "${field}" is required.`);
  const s = v.trim();
  if (max && s.length > max)
    throw new Error(`${file}: "${field}" is ${s.length} characters (max ${max}).`);
  return s;
}

function dateField(v: unknown, field: string, file: string): string {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "");
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(s))) {
    throw new Error(
      `${file}: "${field}" must be YYYY-MM-DD or an ISO date-time with a time zone offset.`,
    );
  }
  return s;
}

/** Parse and validate one post file. Throws with the file name on any problem. */
export function parsePost(raw: string, file: string, fixture = false): Post {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing YAML frontmatter (--- ... ---).`);
  let fm: Record<string, unknown>;
  try {
    fm = (parseYaml(m[1] ?? "") ?? {}) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`${file}: invalid frontmatter YAML: ${(e as Error).message}`);
  }
  const stem = path.basename(file).replace(/\.md$/, "");
  const slug = str(fm.slug, "slug", file);
  if (!SLUG_RE.test(slug))
    throw new Error(
      `${file}: slug "${slug}" must be lowercase letters, digits and hyphens.`,
    );
  if (slug !== stem) throw new Error(`${file}: slug "${slug}" must match the file name.`);

  const topic = str(fm.topic, "topic", file);
  if (!getTopic(topic))
    throw new Error(
      `${file}: unknown topic "${topic}". Add it to content/blog-topics.ts.`,
    );
  const authorSlug = str(fm.author, "author", file);
  if (!getAuthor(authorSlug))
    throw new Error(`${file}: unknown author "${authorSlug}". Add it to lib/authors.ts.`);

  const datePublished = dateField(fm.datePublished, "datePublished", file);
  const dateModified = dateField(
    fm.dateModified ?? fm.datePublished,
    "dateModified",
    file,
  );
  if (Date.parse(dateModified) < Date.parse(datePublished)) {
    throw new Error(`${file}: dateModified is earlier than datePublished.`);
  }

  const tags = fm.tags === undefined ? [] : fm.tags;
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    throw new Error(`${file}: "tags" must be a list of strings.`);
  }
  if (fm.draft !== undefined && typeof fm.draft !== "boolean") {
    throw new Error(`${file}: "draft" must be true or false.`);
  }

  const rawSources = fm.sources === undefined ? [] : fm.sources;
  if (!Array.isArray(rawSources)) throw new Error(`${file}: "sources" must be a list.`);
  const sources: PostSource[] = rawSources.map((s, i) => {
    const o = (s ?? {}) as Record<string, unknown>;
    const url = str(o.url, `sources[${i}].url`, file);
    if (!/^https?:\/\//.test(url))
      throw new Error(`${file}: sources[${i}].url must be an http(s) URL.`);
    return { title: str(o.title, `sources[${i}].title`, file), url };
  });

  const body = (m[2] ?? "").trim();
  if (!body) throw new Error(`${file}: the post has no body.`);
  const rendered = renderMarkdown(body); // also validates directives and headings
  const wordCount = rendered.text.split(/\s+/).filter(Boolean).length;

  return {
    title: str(fm.title, "title", file, 110),
    description: str(fm.description, "description", file, 200),
    slug,
    topic,
    tags: tags as string[],
    author: authorSlug,
    datePublished,
    dateModified,
    draft: fm.draft === true,
    reviewedBy:
      fm.reviewedBy === undefined ? undefined : str(fm.reviewedBy, "reviewedBy", file),
    sources,
    body,
    wordCount,
    readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
    fixture,
  };
}

export function loadPostsFromDir(dir: string, fixture = false): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePost(fs.readFileSync(path.join(dir, f), "utf8"), f, fixture));
}

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      Date.parse(b.datePublished) - Date.parse(a.datePublished) ||
      a.slug.localeCompare(b.slug),
  );
}

let cache: Post[] | undefined;

function loadAll(): Post[] {
  const useCache = process.env.NODE_ENV !== "development";
  if (useCache && cache) return cache;
  const root = process.cwd();
  const posts = loadPostsFromDir(path.join(root, "content", "blog"));
  if (process.env.BLOG_FIXTURES === "1") {
    posts.push(...loadPostsFromDir(path.join(root, "tests", "fixtures", "blog"), true));
  }
  const seen = new Set<string>();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`Duplicate post slug "${p.slug}".`);
    seen.add(p.slug);
  }
  const sorted = sortPosts(posts);
  if (useCache) cache = sorted;
  return sorted;
}

/** Published posts only (no drafts), newest first. The only list public pages may use. */
export function getPublishedPosts(): Post[] {
  return loadAll().filter((p) => !p.draft);
}

export function hasPublishedPosts(): boolean {
  return getPublishedPosts().length > 0;
}

/** Posts that get a page: published, plus drafts in `next dev` only (never in a build). */
export function getRoutablePosts(): Post[] {
  return process.env.NODE_ENV === "development" ? loadAll() : getPublishedPosts();
}

export function getPostBySlug(slug: string): Post | undefined {
  return getRoutablePosts().find((p) => p.slug === slug);
}

export const postPath = (p: Pick<Post, "slug">) => `/blog/${p.slug}`;

export function getPostsByTopic(topic: string, posts = getPublishedPosts()): Post[] {
  return posts.filter((p) => p.topic === topic);
}

/** Topics that have enough published posts to deserve their own page. */
export function getHubTopics(posts = getPublishedPosts()): (Topic & { count: number })[] {
  return topics
    .map((t) => ({ ...t, count: getPostsByTopic(t.slug, posts).length }))
    .filter((t) => t.count >= MIN_POSTS_FOR_HUB);
}

export function getPostsByAuthor(slug: string, posts = getPublishedPosts()): Post[] {
  return posts.filter((p) => p.author === slug);
}

export function getRelatedPosts(
  post: Post,
  limit = 3,
  posts = getPublishedPosts(),
): Post[] {
  return posts
    .filter((p) => p.slug !== post.slug && p.topic === post.topic)
    .slice(0, limit);
}

export function pageCount(total: number, size = POSTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / size));
}

export function paginate<T>(items: T[], page: number, size = POSTS_PER_PAGE): T[] {
  return items.slice((page - 1) * size, page * size);
}

/** Newest dateModified among posts (real data for sitemap lastModified), or undefined. */
export function latestModified(posts: Post[]): string | undefined {
  if (!posts.length) return undefined;
  return posts
    .map((p) => p.dateModified)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

const rendered = new Map<string, RenderedMarkdown>();
export function renderPostBody(post: Post): RenderedMarkdown {
  let r = rendered.get(post.slug);
  if (!r || process.env.NODE_ENV === "development") {
    r = renderMarkdown(post.body);
    rendered.set(post.slug, r);
  }
  return r;
}

export function postAuthor(post: Post): Author {
  const a = getAuthor(post.author);
  if (!a) throw new Error(`Unknown author "${post.author}" on ${post.slug}`);
  return a;
}
