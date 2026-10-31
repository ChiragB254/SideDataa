import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container, Row } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PostList } from "@/components/blog/PostList";
import { getHubTopics, getPublishedPosts, pageCount, paginate } from "@/lib/blog";

const pageHref = (n: number) => (n === 1 ? "/blog" : `/blog/page/${n}`);

/** Index of published posts (page 1 at /blog, later pages at /blog/page/n). */
export function BlogIndex({ page }: { page: number }) {
  const all = getPublishedPosts();
  const pages = pageCount(all.length);
  const posts = paginate(all, page);
  const hubs = getHubTopics();

  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              ...(page > 1 ? [{ label: `Page ${page}`, href: pageHref(page) }] : []),
            ]}
          />
          <p className="eyebrow mt-2">Blog</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            {page > 1 ? `Articles, page ${page}` : "Articles from SideData"}
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">
            Practical notes on AI, web development, servers, cloud and IT, written by a
            named person and reviewed before publishing. See our{" "}
            <Link className="link" href="/about/editorial-policy">
              editorial policy
            </Link>
            .
          </p>
          {hubs.length && page === 1 ? (
            <nav aria-label="Topics" className="mt-6">
              <ul className="flex flex-wrap gap-x-6">
                {hubs.map((t) => (
                  <li key={t.slug}>
                    <Link
                      className="link inline-flex min-h-11 items-center"
                      href={`/blog/topic/${t.slug}`}
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </Container>
      </section>

      <Row
        id="posts"
        tone="tint"
        label="Latest"
        heading={
          <h2 id="posts-title" className="sr-only">
            Articles
          </h2>
        }
      >
        <PostList posts={posts} />
        {pages > 1 ? (
          <nav aria-label="Pagination" className="mt-8">
            <ul className="flex flex-wrap items-center gap-x-4">
              {page > 1 ? (
                <li>
                  <Link
                    className="link inline-flex min-h-11 items-center"
                    href={pageHref(page - 1)}
                    rel="prev"
                  >
                    Newer articles
                  </Link>
                </li>
              ) : null}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <Link
                    className="link inline-flex min-h-11 min-w-11 items-center justify-center"
                    href={pageHref(n)}
                    aria-current={n === page ? "page" : undefined}
                    aria-label={`Page ${n}`}
                  >
                    {n}
                  </Link>
                </li>
              ))}
              {page < pages ? (
                <li>
                  <Link
                    className="link inline-flex min-h-11 items-center"
                    href={pageHref(page + 1)}
                    rel="next"
                  >
                    Older articles
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </Row>
      <CtaBand />
    </>
  );
}

/**
 * Shown while nothing is published. The page is noindex and not in the sitemap, and
 * "Blog" is not in the navigation, until there is at least one published post.
 * TODO(owner): publish the first post (content/blog/<slug>.md, draft: false) to switch
 * the blog on: nav link, sitemap entry and RSS link all appear automatically.
 */
export function BlogEmpty() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
            ]}
          />
          <p className="eyebrow mt-2">Blog</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            Articles are coming.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">
            We have not published any articles yet. When we do, each one will have a named
            author and be reviewed before it goes live. Until then, our free planning tool
            and service pages are the best place to start.
          </p>
        </Container>
      </section>
      <Row
        id="meanwhile"
        tone="tint"
        label="Meanwhile"
        heading={
          <h2 id="meanwhile-title" className="sr-only">
            Other places to start
          </h2>
        }
      >
        <ul className="flex flex-wrap gap-x-8">
          <li>
            <Link className="link inline-flex min-h-11 items-center" href="/services">
              Our services
            </Link>
          </li>
          <li>
            <Link
              className="link inline-flex min-h-11 items-center"
              href="/tools/ai-savings-estimator"
            >
              AI savings and growth estimator
            </Link>
          </li>
          <li>
            <Link
              className="link inline-flex min-h-11 items-center"
              href="/about/editorial-policy"
            >
              How we write and review our content
            </Link>
          </li>
        </ul>
      </Row>
    </>
  );
}
