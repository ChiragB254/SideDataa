import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container, Row } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PostList } from "@/components/blog/PostList";
import { getService } from "@/content/services";
import { getHubTopics, getPostsByTopic } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

type Params = { topic: string };

/** Only topics with enough published posts get a page (see MIN_POSTS_FOR_HUB). */
export function generateStaticParams(): Params[] {
  return getHubTopics().map((t) => ({ topic: t.slug }));
}

export const dynamicParams = false;

const findTopic = (slug: string) => getHubTopics().find((t) => t.slug === slug);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const topic = findTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: topic.name,
    description: topic.intro,
    path: `/blog/topic/${topic.slug}`,
  });
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const topic = findTopic((await params).topic);
  if (!topic) notFound();
  const posts = getPostsByTopic(topic.slug);
  const service = getService(topic.service);

  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: topic.name, href: `/blog/topic/${topic.slug}` },
            ]}
          />
          <p className="eyebrow mt-2">Topic</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            {topic.name}
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">{topic.intro}</p>
          {service ? (
            <p className="mt-4">
              <Link
                className="link inline-flex min-h-11 items-center"
                href={`/services/${service.slug}`}
              >
                Our service: {service.title}
              </Link>
            </p>
          ) : null}
        </Container>
      </section>
      <Row
        id="posts"
        tone="tint"
        label="Articles"
        heading={
          <h2 id="posts-title" className="sr-only">
            Articles on {topic.name}
          </h2>
        }
      >
        <PostList posts={posts} />
      </Row>
      <CtaBand />
    </>
  );
}
