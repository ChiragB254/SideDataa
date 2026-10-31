import { Container } from "@/components/Container";
import { ContactForm } from "@/components/forms/ContactForm";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact SideData Technologies in Toronto, Ontario, Canada about AI, web development, servers, cloud or IT support. Email support@sidedataa.com or use the form.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-6 max-w-[20ch] text-5xl leading-[1.1] md:text-6xl">
          Tell us what you need.
        </h1>
        <div className="mt-14 grid gap-14 md:grid-cols-12 md:gap-x-10">
          <aside aria-labelledby="direct" className="md:col-span-4">
            <h2 id="direct" className="eyebrow !font-sans">
              Direct
            </h2>
            <dl className="mt-4 border-b border-rule">
              <div className="border-t border-rule py-4">
                <dt className="text-sm text-muted">Email</dt>
                <dd>
                  <a
                    className="link inline-flex min-h-11 items-center break-all"
                    href={`mailto:${site.email}`}
                  >
                    {site.email}
                  </a>
                </dd>
              </div>
              <div className="border-t border-rule py-4">
                <dt className="text-sm text-muted">Location</dt>
                <dd>{site.locationLabel}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-ink-soft">
              We use what you send only to reply to you. See the{" "}
              <Link className="link" href="/privacy">
                privacy notice
              </Link>
              .
            </p>
          </aside>

          <div className="md:col-span-8">
            <h2 className="mb-8 text-3xl">Send a message</h2>
            <div className="max-w-xl">
              <ContactForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
