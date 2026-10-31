import Link from "next/link";
import { Container, Row, RowTitle } from "@/components/Container";
import { ServiceCarousel } from "@/components/ServiceCarousel";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";
import { Steps } from "@/components/Steps";
import { ArrowLink } from "@/components/ArrowLink";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { howWeWork, stack } from "@/content/work";
import { organization, website } from "@/lib/jsonld";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <JsonLd data={organization()} />
      <JsonLd data={website()} />
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-7 xl:col-span-6">
              <p className="eyebrow">
                {site.name} &middot; {site.locationLabel}
              </p>
              <h1 className="mt-6 max-w-[22ch] text-[2.5rem] leading-[1.06] break-words sm:text-6xl lg:text-[3.5rem] xl:text-[3.75rem]">
                We build software and AI systems, and look after the infrastructure behind
                them.
              </h1>
              <p className="mt-8 max-w-xl text-lg text-ink-soft">
                SideData is an IT company in Toronto. We develop AI applications, websites
                and web applications, and we manage servers, cloud environments and
                everyday IT for the organisations that depend on them.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Link href="/contact" className="btn">
                  Start a conversation
                </Link>
                <Link
                  href="/services"
                  className="link inline-flex min-h-11 items-center font-medium"
                >
                  See what we do
                </Link>
              </div>
            </div>
            <div className="art-panel bg-dots mx-auto w-full max-w-md min-w-0 p-4 sm:p-6 lg:col-span-5 lg:max-w-none xl:col-span-6">
              <HeroIllustration />
            </div>
          </div>
        </Container>
      </section>

      <Row
        id="services"
        label="What we build"
        tone="tint"
        heading={
          <RowTitle id="services">Five areas of work, one way of working.</RowTitle>
        }
      >
        <ServiceCarousel />
        <p className="mt-6">
          <ArrowLink href="/services">See all services</ArrowLink>
        </p>
        <p className="measure mt-2 text-ink-soft">
          Weighing up an AI project? Try our free{" "}
          <Link href="/tools/ai-savings-estimator" className="link">
            AI savings and growth estimator
          </Link>{" "}
          to see roughly what it could cost and when it might pay back.
        </p>
      </Row>

      <Row
        id="how"
        label="How we work"
        heading={
          <RowTitle id="how">
            Plain steps, and no surprises about what comes next.
          </RowTitle>
        }
      >
        <Steps steps={howWeWork} />
      </Row>

      <Row
        id="stack"
        tone="wash"
        label="What we build with"
        heading={<RowTitle id="stack">Common, well-supported tools.</RowTitle>}
      >
        <p className="measure mb-8 text-ink-soft">
          We pick tools your next developer will recognise. If you already run something
          different, we will work with it.
        </p>
        <dl className="border-b border-rule">
          {stack.map((s) => (
            <div
              key={s.group}
              className="grid gap-1 border-t border-rule py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-8"
            >
              <dt className="text-muted">{s.group}</dt>
              <dd>{s.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Row>

      <CtaBand />
    </>
  );
}
