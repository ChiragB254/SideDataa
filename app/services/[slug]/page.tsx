import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Row, RowTitle } from "@/components/Container";
import { ServiceIllustration } from "@/components/illustrations/ServiceIllustrations";
import { Steps } from "@/components/Steps";
import { CtaBand } from "@/components/CtaBand";
import { getService, services } from "@/content/services";
import { pageMetadata } from "@/lib/metadata";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return services.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return pageMetadata({
    title: service.title,
    description: service.summary,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap gap-2 text-sm text-muted">
              <li>
                <Link href="/services" className="link inline-flex min-h-11 items-center">
                  Services
                </Link>
              </li>
              <li aria-hidden="true" className="inline-flex items-center">
                /
              </li>
              <li aria-current="page" className="inline-flex items-center">
                {service.title}
              </li>
            </ol>
          </nav>
          <div className="mt-2 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 className="mt-2 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
                {service.title}
              </h1>
              <div className="mt-8 max-w-xl space-y-4 text-lg text-ink-soft">
                {service.intro.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            <div className="art-panel bg-dots p-6 lg:col-span-5">
              <ServiceIllustration slug={service.slug} />
            </div>
          </div>
        </Container>
      </section>

      <Row
        id="what"
        label="What we do"
        heading={<RowTitle id="what">The work in this area.</RowTitle>}
      >
        <dl className="border-b border-rule">
          {service.whatWeDo.map((item) => (
            <div
              key={item.title}
              className="grid gap-1 border-t border-rule py-5 md:grid-cols-[16rem_1fr] md:gap-8"
            >
              <dt className="font-serif text-xl leading-snug">{item.title}</dt>
              <dd className="text-ink-soft">{item.body}</dd>
            </div>
          ))}
        </dl>
      </Row>

      <Row
        id="engagements"
        tone="tint"
        label="Typical engagements"
        heading={
          <RowTitle id="engagements">Examples of how people ask for this.</RowTitle>
        }
      >
        <ul className="measure border-b border-rule">
          {service.engagements.map((e) => (
            <li key={e} className="border-t border-rule py-3">
              {e}
            </li>
          ))}
        </ul>
      </Row>

      <Row
        id="how"
        label="How it works"
        heading={<RowTitle id="how">From first call to handover.</RowTitle>}
      >
        <Steps steps={service.process} />
      </Row>

      <Row
        id="tech"
        tone="wash"
        label="Tech"
        heading={<RowTitle id="tech">What we usually use.</RowTitle>}
      >
        <p className="measure text-ink-soft">{service.tech.join(", ")}.</p>
        <p className="measure mt-3 text-ink-soft">
          If your environment already runs on something else, we will tell you what we can
          support.
        </p>
      </Row>

      <CtaBand title={`Talk to us about ${service.title.toLowerCase()}.`} />

      <Row
        id="other"
        label="Other services"
        heading={
          <h2 id="other-title" className="sr-only">
            Other services
          </h2>
        }
      >
        <ul className="flex flex-wrap gap-x-8">
          {others.map((s) => (
            <li key={s.slug}>
              <Link
                className="link inline-flex min-h-11 items-center"
                href={`/services/${s.slug}`}
              >
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </Row>
    </>
  );
}
