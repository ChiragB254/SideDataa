import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container, Row, RowTitle } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { EstimatorTool } from "@/components/tools/EstimatorTool";
import {
  author,
  commonMistakes,
  estimatorPage as page,
  faq,
  glossary,
  goodFirstProject,
  howToUse,
  leavesOut,
} from "@/content/estimator";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  ownImage: true,
});

const url = `${site.url}${page.path}`;

const publisher = { "@type": "Organization", name: site.name, url: site.url };
const person = {
  "@type": "Person",
  name: author.name,
  jobTitle: author.role,
  worksFor: publisher,
  url: `${site.url}${author.cardPath}`,
};

const webApplication = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: page.name,
  url,
  description: page.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "en-CA",
  isAccessibleForFree: true,
  dateModified: page.updatedISO,
  offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
  publisher,
  author: person,
};

const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    { "@type": "ListItem", position: 2, name: "Tools", item: `${site.url}/tools` },
    { "@type": "ListItem", position: 3, name: page.name, item: url },
  ],
};

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function TitledList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ul className="measure border-b border-rule">
      {items.map((i) => (
        <li key={i.title} className="border-t border-rule py-4">
          <p className="font-serif text-xl leading-snug">{i.title}</p>
          <p className="mt-1 text-ink-soft">{i.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default function EstimatorPage() {
  return (
    <>
      <JsonLd data={webApplication} />
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqPage} />

      <section className="pt-12 pb-10 md:pt-16 md:pb-14">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Tools", href: "/tools" },
              { label: page.name },
            ]}
          />
          <p className="eyebrow mt-2">Free tool</p>
          <h1 className="mt-6 max-w-[24ch] text-4xl leading-[1.1] md:text-6xl">
            {page.name}
          </h1>
          <div className="mt-8 max-w-2xl space-y-4 text-lg text-ink-soft">
            {page.answer.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Written by {author.name}, {author.role}, {author.org}. Last updated{" "}
            <time dateTime={page.updatedISO}>{page.updatedLabel}</time>. A planning aid,
            not financial, legal or technical advice.
          </p>
        </Container>
      </section>

      <section
        id="estimator"
        aria-labelledby="estimator-title"
        className="border-t border-rule py-12 md:py-16"
      >
        <Container>
          <h2
            id="estimator-title"
            className="mb-8 text-3xl leading-tight md:text-[2.5rem]"
          >
            Estimate one workflow
          </h2>
          <EstimatorTool />
        </Container>
      </section>

      <Row
        id="use"
        tone="tint"
        label="How to use it"
        heading={<RowTitle id="use">How to use this estimator.</RowTitle>}
      >
        <ol className="measure border-b border-rule">
          {howToUse.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-cols-[2rem_1fr] gap-x-2 border-t border-rule py-4"
            >
              <span className="font-serif text-xl text-muted" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="font-serif text-xl leading-snug">{s.title}</p>
                <p className="mt-1 text-ink-soft">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Row>

      <Row
        id="first-project"
        label="Choosing a project"
        heading={
          <RowTitle id="first-project">What counts as a good first AI project.</RowTitle>
        }
      >
        <p className="measure mb-6 text-ink-soft">
          A good first project is small enough to test and clear enough to measure. These
          traits make a workflow a better candidate. None is a guarantee, and a workflow
          can still be worth doing without all of them.
        </p>
        <TitledList items={goodFirstProject} />
        <p className="mt-6">
          <Link href="/services/ai-development" className="link">
            See how we approach AI development
          </Link>
        </p>
      </Row>

      <Row
        id="leaves-out"
        tone="wash"
        label="Limits"
        heading={<RowTitle id="leaves-out">What the estimate leaves out.</RowTitle>}
      >
        <p className="measure mb-6 text-ink-soft">
          The calculator covers the numbers you can enter. These real costs and risks are
          not in it, so add your own allowance or treat the result as a best case.
        </p>
        <TitledList items={leavesOut} />
      </Row>

      <Row
        id="mistakes"
        label="Pitfalls"
        heading={
          <RowTitle id="mistakes">Common mistakes when estimating AI ROI.</RowTitle>
        }
      >
        <TitledList items={commonMistakes} />
      </Row>

      <Row
        id="glossary"
        tone="tint"
        label="Glossary"
        heading={<RowTitle id="glossary">Terms in plain words.</RowTitle>}
      >
        <dl className="measure border-b border-rule">
          {glossary.map((g) => (
            <div key={g.term} className="border-t border-rule py-4">
              <dt className="font-serif text-xl leading-snug">{g.term}</dt>
              <dd className="mt-1 text-ink-soft">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </Row>

      <Row
        id="faq"
        label="Questions"
        heading={<RowTitle id="faq">Frequently asked questions.</RowTitle>}
      >
        <div className="measure border-b border-rule">
          {faq.map((f) => (
            <div key={f.q} className="border-t border-rule py-5">
              <h3 className="font-serif text-xl leading-snug">{f.q}</h3>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </Row>

      <Row
        id="author"
        tone="wash"
        label="About the author"
        heading={
          <h2 id="author-title" className="sr-only">
            About the author
          </h2>
        }
      >
        <div className="measure">
          <p className="font-serif text-2xl">{author.name}</p>
          <p className="mt-1 text-ink-soft">
            {author.role}, {author.org}. {author.place}.
          </p>
          <p className="mt-1 text-ink-soft">{author.credential}.</p>
          <p className="mt-3">
            <Link
              href={author.cardPath}
              className="link inline-flex min-h-11 items-center"
            >
              Digital card
            </Link>
          </p>
          <p className="mt-4 text-sm text-muted">
            This estimator is a planning aid. It does not give financial, legal or
            technical advice, and it does not promise any result.
          </p>
        </div>
      </Row>

      <Row
        id="next"
        label="Next step"
        heading={
          <RowTitle id="next">
            Want help turning an estimate into a plan? Talk to us.
          </RowTitle>
        }
      >
        <p className="measure text-ink-soft">
          Bring your numbers or just the workflow. We will look at it with you and say
          plainly whether AI is worth building for it, and what a small first step could
          be.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link href="/contact" className="btn">
            Talk to us
          </Link>
          <Link
            href="/services/ai-development"
            className="link inline-flex min-h-11 items-center font-medium"
          >
            AI development services
          </Link>
        </div>
      </Row>
    </>
  );
}
