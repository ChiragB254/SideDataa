import Link from "next/link";
import { getTopic } from "@/content/blog-topics";
import { postPath, type Post } from "@/lib/blog";
import { formatDate } from "@/lib/dates";

/** Crawlable list of posts: title link, date, topic and summary. */
export function PostList({
  posts,
  headingLevel = 2,
}: {
  posts: Post[];
  headingLevel?: 2 | 3;
}) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <ul className="measure border-b border-rule">
      {posts.map((p) => (
        <li key={p.slug} className="border-t border-rule py-6">
          <p className="text-sm text-muted">
            <time dateTime={p.datePublished}>{formatDate(p.datePublished)}</time>
            {getTopic(p.topic) ? <> &middot; {getTopic(p.topic)?.name}</> : null}
          </p>
          <H className="mt-1 text-2xl leading-snug">
            <Link href={postPath(p)} className="link no-underline hover:underline">
              {p.title}
            </Link>
          </H>
          <p className="mt-2 text-ink-soft">{p.description}</p>
        </li>
      ))}
    </ul>
  );
}
