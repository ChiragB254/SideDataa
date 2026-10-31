import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container } from "@/components/Container";
import { editorialPolicy as policy } from "@/content/editorial";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: policy.title,
  description: policy.description,
  path: policy.path,
});

export default function EditorialPolicyPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: policy.title, href: policy.path },
          ]}
        />
        <p className="eyebrow mt-2">About</p>
        <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
          How we write and review our content.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-ink-soft">
          This is the plain version of how {site.name} produces the articles and tools on
          this site, and what you can expect from them.
        </p>
        <p className="mt-4 text-sm text-muted">
          Last reviewed: <time dateTime={policy.reviewedISO}>{policy.reviewedLabel}</time>
        </p>

        <ol className="measure mt-12 border-b border-rule">
          {policy.principles.map((p) => (
            <li key={p.title} className="border-t border-rule py-5">
              <h2 className="font-serif text-xl leading-snug">{p.title}</h2>
              <p className="mt-2 text-ink-soft">{p.body}</p>
            </li>
          ))}
        </ol>

        <p className="measure mt-10 text-ink-soft">
          Questions or corrections:{" "}
          <a className="link" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          . You can also read about the{" "}
          <Link className="link" href="/authors/chirag-bansal">
            author, Chirag Bansal
          </Link>
          , or{" "}
          <Link className="link" href="/about">
            about {site.name}
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
