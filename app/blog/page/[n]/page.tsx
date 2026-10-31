import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { getPublishedPosts, pageCount } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

type Params = { n: string };

/** Pages 2 and up exist only when there are more than 10 published posts. */
export function generateStaticParams(): Params[] {
  const pages = pageCount(getPublishedPosts().length);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const n = Number((await params).n);
  return pageMetadata({
    title: `Blog, page ${n}`,
    description: `Older articles from SideData Technologies on AI, web development, servers, cloud and IT. Page ${n}.`,
    path: `/blog/page/${n}`,
  });
}

export default async function BlogPageN({ params }: { params: Promise<Params> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 2 || n > pageCount(getPublishedPosts().length))
    notFound();
  return <BlogIndex page={n} />;
}
