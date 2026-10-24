import Link from "next/link";
import { Container, Row, RowTitle } from "@/components/Container";
import { ServiceList } from "@/components/ServiceList";
import { Steps } from "@/components/Steps";
import { CtaBand } from "@/components/CtaBand";
import { howWeWork, stack } from "@/content/work";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <p className="eyebrow">
            {site.name} &middot; {site.locationLabel}
          </p>
          <h1 className="mt-6 max-w-[24ch] text-[2.5rem] leading-[1.08] sm:text-6xl md:text-[4.25rem]">
            We build software and AI systems, and look after the infrastructure behind
            them.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">
            SideData is an IT company in Toronto. We develop AI applications, websites and
            web applications, and we manage servers, cloud environments and everyday IT
            for the organisations that depend on them.
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
        </Container>
      </section>

      <Row
        id="services"
        label="Services"
        heading={
          <RowTitle id="services">Five areas of work, one way of working.</RowTitle>
        }
      >
        <ServiceList />
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
              className="grid gap-1 border-t border-rule py-4 sm:grid-cols-[14rem_1fr] sm:gap-8"
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
