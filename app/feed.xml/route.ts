import { getPublishedPosts } from "@/lib/blog";
import { buildFeed } from "@/lib/feed";

/** RSS 2.0 feed of published posts (drafts never appear). Rendered once at build time. */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildFeed(getPublishedPosts()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
