import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Container, Row } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { estimatorPage } from "@/content/estimator";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free tools",
  description:
    "Free planning tools from SideData Technologies. They run in your browser and nothing you enter is sent or stored.",
  path: "/tools",
  ownImage: true,
});

export default function ToolsPage() {
  return (
    <>
      <section className="py-16 md:py-24">
        <Container>
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Tools", href: "/tools" },
            ]}
          />
          <p className="eyebrow mt-2">Tools</p>
          <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">
            Free tools for planning your work.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-soft">
            Small tools we built to help you think through a decision before you spend
            money on it. They run in your browser. Nothing you enter is sent to us, saved,
            or put in the web address, and there is no account to create.
          </p>
        </Container>
      </section>

      <Row
        id="list"
        tone="tint"
        label="Available now"
        heading={
          <h2 id="list-title" className="sr-only">
            Available tools
          </h2>
        }
      >
        <ul className="grid gap-6 md:grid-cols-2">
          <li className="card flex min-w-0 flex-col p-6">
            <p className="eyebrow">Calculator</p>
            <h3 className="mt-2 text-2xl leading-snug">
              <Link
                href={estimatorPage.path}
                className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 hover:decoration-accent"
              >
                {estimatorPage.name}
              </Link>
            </h3>
            <p className="mt-3 flex-1 text-ink-soft">
              Work out roughly what automating one workflow with AI could save, what it
              would cost to build and run, and when it could pay back. It is a planning
              aid, not a forecast.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 font-medium text-accent">
              Open the estimator
              <svg
                viewBox="0 0 16 16"
                className="card-arrow h-3.5 w-3.5"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M2 8h11M9 3.5 13.5 8 9 12.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </p>
          </li>
        </ul>
      </Row>

      <CtaBand
        title="Need a hand with the decision itself?"
        body="Tell us what you are weighing up and we will tell you plainly what we think."
      />
    </>
  );
}
