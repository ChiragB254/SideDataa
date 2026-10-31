import type { Metadata } from "next";
import { BlogEmpty, BlogIndex } from "@/components/blog/BlogIndex";
import { hasPublishedPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const published = hasPublishedPosts();
  return pageMetadata({
    title: published ? "Blog" : "Articles are coming",
    description: published
      ? "Practical articles on AI, web development, servers, cloud and IT from SideData Technologies in Toronto, written by a named author."
      : "SideData Technologies has not published any articles yet.",
    path: "/blog",
    // Nothing to index until the first post is published.
    noindex: !published,
  });
}

export default function BlogPage() {
  return hasPublishedPosts() ? <BlogIndex page={1} /> : <BlogEmpty />;
}
