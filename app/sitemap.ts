import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { sitemapEntries } from "@/lib/sitemap-entries";

// No changefreq or priority (Google ignores them); lastModified only from real dates.
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(getPublishedPosts());
}
