import { Container, Row, RowTitle } from "@/components/Container";
import { ServiceCards } from "@/components/ServiceCards";
import { CtaBand } from "@/components/CtaBand";
import { Steps } from "@/components/Steps";
import { howWeWork } from "@/content/work";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services",
  description:
    "AI development, website and web application development, server management, cloud services, and IT services and support from SideData Technologies in Toronto.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <p className="eyebrow">Services</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            What we do, and what a typical engagement looks like.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">
            Each area has its own page with the kinds of work we take on, how we approach
            it and the tools we use. If your need sits between two of them, that is
            common, and we can cover both.
          </p>
        </Container>
      </section>
      <Row
        id="list"
        tone="tint"
        label="All services"
        heading={
          <h2 id="list-title" className="sr-only">
            All services
          </h2>
        }
      >
        <ServiceCards />
      </Row>
      <Row
        id="process"
        label="Approach"
        heading={
          <RowTitle id="process">The same four steps apply to every service.</RowTitle>
        }
      >
        <Steps steps={howWeWork} />
      </Row>
      <CtaBand />
    </>
  );
}
