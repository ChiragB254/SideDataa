import Link from "next/link";
import { Row, RowTitle } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { CtaBand } from "@/components/CtaBand";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description:
    "SideData Technologies is an IT company based in Toronto, Ontario. How we work, what we believe in, and how we treat the people we work with.",
  path: "/about",
});

const principles = [
  {
    title: "Say what we know and what we do not",
    body: "If we are unsure, we say so and find out. We would rather give you a slower, correct answer than a quick, confident one.",
  },
  {
    title: "Write things down",
    body: "Scopes, decisions and handover notes are written, so nobody depends on memory and your next supplier can pick up where we stopped.",
  },
  {
    title: "Build for the next person",
    body: "Clear code, common tools and documentation. You should never be locked in because only we understand what we built.",
  },
  {
    title: "Include everyone who uses it",
    body: "Accessibility is part of the work from the first design, not a repair at the end.",
  },
  // TODO(owner): confirm that all work is reviewed by a second person.
  {
    title: "Review each other's work",
    body: "Nothing ships unreviewed. Code, copy and designs are all read by a second person.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="An IT company in Toronto that writes things down."
      >
        <p>
          {site.name} designs and builds software and AI systems, and manages the servers,
          cloud environments and everyday IT that organisations rely on.
        </p>
        <p>
          We are based in {site.locationLabel}. We keep the company deliberately plain:
          clear scopes, short cycles, regular demos and honest communication.
        </p>
      </PageHeader>

      <Row
        id="approach"
        label="Approach"
        heading={<RowTitle id="approach">Small steps, shown early.</RowTitle>}
      >
        <div className="prose-copy measure text-ink-soft">
          <p>
            Most projects go wrong because the first time anyone sees the work is near the
            end. We work the other way round. We agree a small first piece, build it, show
            it to you, and use what we learn to plan the next piece.
          </p>
          <p>
            That applies equally to a website, an AI tool, a server migration or a
            security clean-up. You always know what has been done, what is next, and what
            it will cost to change direction.
          </p>
        </div>
      </Row>

      <Row
        id="principles"
        label="Principles"
        heading={<RowTitle id="principles">What we hold ourselves to.</RowTitle>}
      >
        <ol className="border-b border-rule">
          {principles.map((p, i) => (
            <li
              key={p.title}
              className="grid gap-1 border-t border-rule py-5 md:grid-cols-[3rem_16rem_1fr] md:gap-8"
            >
              <span
                className="font-serif text-lg text-muted tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl leading-snug">{p.title}</h3>
              <p className="text-ink-soft">{p.body}</p>
            </li>
          ))}
        </ol>
      </Row>

      <Row
        id="people"
        label="People"
        heading={<RowTitle id="people">Unpaid internships in India.</RowTitle>}
      >
        <div className="prose-copy measure text-ink-soft">
          {/* TODO(owner): confirm the student and mentorship wording; add detail about the work or feedback only if you will provide it. */}
          <p>
            We offer unpaid internships to students and early-career people. They run in
            India under a joint venture between {site.name} and Right Click Orbit (India),
            and include mentorship.
          </p>
          <p>
            If that interests you, see <Link href="/careers">careers</Link>.
          </p>
        </div>
      </Row>

      <Row
        id="place"
        label="Where we are"
        heading={<RowTitle id="place">Based in Toronto.</RowTitle>}
      >
        <p className="measure text-ink-soft">
          We are in {site.locationLabel}. Email{" "}
          <a className="link" href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          to reach us.
        </p>
      </Row>

      <CtaBand />
    </>
  );
}
