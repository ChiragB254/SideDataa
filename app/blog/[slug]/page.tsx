import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type Crumb } from "@/components/Breadcrumb";
import { Container, Row, RowTitle } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PostBody } from "@/components/blog/PostBody";
import { PostList } from "@/components/blog/PostList";
import { Toc } from "@/components/blog/Toc";
import { getTopic } from "@/content/blog-topics";
import { editorialPolicy } from "@/content/editorial";
import { getService } from "@/content/services";
import { authorPath } from "@/lib/authors";
import {
  getHubTopics,
  getPostBySlug,
  getRelatedPosts,
  getRoutablePosts,
  postAuthor,
  postPath,
  renderPostBody,
} from "@/lib/blog";
import { formatDate } from "@/lib/dates";
import { article, faqPage, isoWithOffset } from "@/lib/jsonld";
import { absoluteUrl, defaultOgImage, pageMetadata } from "@/lib/seo";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getRoutablePosts().map((p) => ({ slug: p.slug }));
}

/** Slugs that are not generated (including drafts in a production build) return 404. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const post = getPostBySlug((await params).slug);
  if (!post) return {};
  const author = postAuthor(post);
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: postPath(post),
    type: "article",
    publishedTime: isoWithOffset(post.datePublished),
    modifiedTime: isoWithOffset(post.dateModified),
    authors: [absoluteUrl(authorPath(author))],
    noindex: post.draft,
  });
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const post = getPostBySlug((await params).slug);
  if (!post) notFound();

  const author = postAuthor(post);
  const topic = getTopic(post.topic);
  const hub = getHubTopics().find((t) => t.slug === post.topic);
  const service = topic ? getService(topic.service) : undefined;
  const rendered = renderPostBody(post);
  const related = getRelatedPosts(post);

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    ...(hub ? [{ label: hub.name, href: `/blog/topic/${hub.slug}` }] : []),
    { label: post.title, href: postPath(post) },
  ];

  return (
    <>
      <JsonLd
        data={article({
          headline: post.title,
          description: post.description,
          path: postPath(post),
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          author,
          image: defaultOgImage.url,
          wordCount: post.wordCount,
        })}
      />
      {rendered.faq.length ? (
        <JsonLd data={faqPage(rendered.faq.map((f) => ({ q: f.q, a: f.aText })))} />
      ) : null}

      <article>
        <header className="py-14 md:py-20">
          <Container>
            <Breadcrumb items={crumbs} />
            {post.draft ? (
              <p
                className="mt-4 border border-danger px-3 py-2 text-danger"
                role="status"
              >
                Draft preview. This page is not published and returns 404 in production.
              </p>
            ) : null}
            <p className="eyebrow mt-2">{topic?.name ?? "Article"}</p>
            <h1 className="mt-6 max-w-[26ch] text-4xl leading-[1.1] md:text-6xl">
              {post.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-ink-soft">{post.description}</p>
            <p className="mt-6 flex flex-wrap items-center gap-x-4 text-sm text-muted">
              <span>
                By{" "}
                <Link className="link" href={authorPath(author)} rel="author">
                  {author.name}
                </Link>
                , {author.jobTitle}
              </span>
              <span>
                Published{" "}
                <time dateTime={post.datePublished}>
                  {formatDate(post.datePublished)}
                </time>
              </span>
              <span>
                Last updated{" "}
                <time dateTime={post.dateModified}>{formatDate(post.dateModified)}</time>
              </span>
              <span>{post.readingMinutes} min read</span>
              {post.reviewedBy ? <span>Reviewed by {post.reviewedBy}</span> : null}
            </p>
          </Container>
        </header>

        <div className="border-t border-rule py-12 md:py-16">
          <Container>
            <div className="min-w-0">
              <Toc headings={rendered.headings} />
              <div className="measure min-w-0">
                <PostBody rendered={rendered} />
              </div>

              {post.sources.length ? (
                <section aria-labelledby="sources-title" className="measure mt-12">
                  <h2 id="sources-title" className="font-serif text-2xl">
                    Sources
                  </h2>
                  <ul className="prose-copy mt-3 text-ink-soft">
                    {post.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} className="[overflow-wrap:anywhere]">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <aside
                aria-labelledby="how-we-write-title"
                className="measure mt-12 border border-rule bg-wash px-5 py-4"
              >
                <h2 id="how-we-write-title" className="font-serif text-xl">
                  How we write and review our content
                </h2>
                <p className="mt-2 text-ink-soft">
                  This article was written by {author.name}, a named person, and edited
                  and fact-checked before publishing. AI tools may help with drafting, but
                  a person is responsible for what is published. Read our{" "}
                  <Link className="link" href={editorialPolicy.path}>
                    editorial policy
                  </Link>
                  , or email corrections to support@sidedataa.com.
                </p>
              </aside>
            </div>
          </Container>
        </div>
      </article>

      <Row
        id="more"
        tone="tint"
        label="Keep reading"
        heading={<RowTitle id="more">Related reading and next steps.</RowTitle>}
      >
        {related.length ? <PostList posts={related} headingLevel={3} /> : null}
        <ul className="mt-6 flex flex-wrap gap-x-8">
          {hub ? (
            <li>
              <Link
                className="link inline-flex min-h-11 items-center"
                href={`/blog/topic/${hub.slug}`}
              >
                More articles: {hub.name}
              </Link>
            </li>
          ) : null}
          <li>
            <Link className="link inline-flex min-h-11 items-center" href="/blog">
              All articles
            </Link>
          </li>
          {service ? (
            <li>
              <Link
                className="link inline-flex min-h-11 items-center"
                href={`/services/${service.slug}`}
              >
                Our service: {service.title}
              </Link>
            </li>
          ) : null}
        </ul>
      </Row>

      <CtaBand />
    </>
  );
}
