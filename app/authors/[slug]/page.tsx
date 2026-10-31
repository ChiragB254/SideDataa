import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container, Row, RowTitle } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PostList } from "@/components/blog/PostList";
import { authorPath, authors, getAuthor } from "@/lib/authors";
import { getPostsByAuthor } from "@/lib/blog";
import { profilePage } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return Object.keys(authors).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const author = getAuthor((await params).slug);
  if (!author) return {};
  return pageMetadata({
    title: `${author.name}, ${author.jobTitle}`,
    description: `${author.name} is the ${author.jobTitle} of ${site.name}, an AI engineer based in Toronto. Articles, links and background.`,
    path: authorPath(author),
    type: "profile",
  });
}

export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const author = getAuthor((await params).slug);
  if (!author) notFound();
  const posts = getPostsByAuthor(author.slug);

  return (
    <>
      <JsonLd data={profilePage(author)} />
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: author.name, href: authorPath(author) },
            ]}
          />
          <p className="eyebrow mt-2">Author</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            {author.name}
          </h1>
          <p className="mt-3 text-lg text-muted">
            {author.jobTitle}, {site.name}. {author.place}.
          </p>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">{author.bio}</p>
        </Container>
      </section>

      <Row
        id="credential"
        tone="tint"
        label="Certification"
        heading={<RowTitle id="credential">Certification and links.</RowTitle>}
      >
        <dl className="measure border-b border-rule">
          <div className="border-t border-rule py-4">
            <dt className="text-sm text-muted">Certification</dt>
            <dd>{author.credential.name}</dd>
          </div>
          <div className="border-t border-rule py-4">
            <dt className="text-sm text-muted">LinkedIn</dt>
            <dd>
              <a
                className="link inline-flex min-h-11 items-center [overflow-wrap:anywhere]"
                href={author.linkedin}
                rel="me noopener"
              >
                {author.linkedin.replace("https://www.", "")}
              </a>
            </dd>
          </div>
          <div className="border-t border-rule py-4">
            <dt className="text-sm text-muted">GitHub</dt>
            <dd>
              <a
                className="link inline-flex min-h-11 items-center [overflow-wrap:anywhere]"
                href={author.github}
                rel="me noopener"
              >
                {author.github.replace("https://", "")}
              </a>
            </dd>
          </div>
          {author.cardPath ? (
            <div className="border-t border-rule py-4">
              <dt className="text-sm text-muted">Digital card</dt>
              <dd>
                <Link
                  className="link inline-flex min-h-11 items-center"
                  href={author.cardPath}
                >
                  Contact details and save-to-phone card
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </Row>

      <Row
        id="articles"
        label="Articles"
        heading={<RowTitle id="articles">Articles by {author.name}.</RowTitle>}
      >
        {posts.length ? (
          <PostList posts={posts} headingLevel={3} />
        ) : (
          <p className="measure text-ink-soft">
            No articles are published yet. Read how we will{" "}
            <Link className="link" href="/about/editorial-policy">
              write and review our content
            </Link>
            .
          </p>
        )}
      </Row>

      <CtaBand />
    </>
  );
}
