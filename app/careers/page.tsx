import Link from "next/link";
import {
  LetterIcon,
  MentorshipIcon,
  SubscriptionIcon,
} from "@/components/illustrations/Icons";
import { Row, RowTitle } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { roles } from "@/content/careers";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Careers",
  description:
    "Unpaid internships in India for a Web Developer, a Content Writer, and a UI/UX and Graphic Designer, run under a joint venture between SideData Technologies and Right Click Orbit (India). Mentorship, a Claude subscription and an experience letter.",
  path: "/careers",
});

/*
 * TODO(owner): internships run in India; confirm with counsel the rules that apply to
 * unpaid internships in India, and the written terms between SideData, Right Click
 * Orbit (India) and interns.
 * TODO(owner): confirm the exact legal or display name of Right Click Orbit (India).
 * Their own website writes "Right Click Orbit".
 * TODO(owner): the Claude subscription and the experience letter below are stated in
 * one plain sentence each. Decide and, if you wish, publish the conditions (for example
 * how long the subscription lasts and what an intern must complete to receive the
 * letter). None are invented here.
 */

/*
 * TODO(owner): the page states only the programme facts you gave: unpaid, runs in
 * India, joint venture with Right Click Orbit (India), and three perks. A "How you
 * learn" section (real projects, code review, written feedback, mentorship detail)
 * was removed because none of it was confirmed; add it back, in your own words, once
 * you know what you will provide. Also decide how and when you will reply to
 * applicants. Hours, duration and working arrangements are deliberately not stated.
 */
const perks = [
  {
    title: "Mentorship",
    body: "You receive mentorship from the team.",
    Icon: MentorshipIcon,
  },
  {
    title: "A Claude subscription",
    body: "You receive a Claude subscription.",
    Icon: SubscriptionIcon,
  },
  {
    title: "An experience letter",
    body: "You receive an experience letter.",
    Icon: LetterIcon,
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="Do real work, and learn how it is done properly."
      >
        <p>
          We offer internships for web developers, content writers, and UI/UX and graphic
          designers. Students and early-career people are welcome to apply.
        </p>
        <p className="border-l-4 border-accent pl-4 font-medium text-ink">
          These internships are unpaid. They run in India.
        </p>
        <p>
          <a className="link inline-flex min-h-11 items-center" href="#apply">
            Go to the application form
          </a>
        </p>
      </PageHeader>

      <Row
        id="get"
        tone="tint"
        label="What you get"
        heading={<RowTitle id="get">Three things come with an internship.</RowTitle>}
      >
        <ul className="grid gap-8 md:grid-cols-3">
          {perks.map(({ title, body, Icon }) => (
            <li key={title} className="border-t border-ink pt-5">
              <Icon className="h-12 w-12" />
              <h3 className="mt-4 text-xl leading-snug">{title}</h3>
              <p className="mt-2 text-ink-soft">{body}</p>
            </li>
          ))}
        </ul>
      </Row>

      <Row
        id="joint-venture"
        label="Joint venture"
        heading={<RowTitle id="joint-venture">Run by two companies.</RowTitle>}
      >
        <div className="prose-copy measure text-ink-soft">
          <p>
            All internships are run under a joint venture between {site.name} and Right
            Click Orbit (India).
          </p>
          <p>
            <a
              className="link"
              href="https://rightclickorbit.com"
              rel="noopener noreferrer"
            >
              rightclickorbit.com (a different website)
            </a>
          </p>
        </div>
      </Row>

      <Row
        id="work"
        label="The work"
        heading={<RowTitle id="work">What the work is.</RowTitle>}
      >
        <div className="prose-copy measure text-ink-soft">
          <p>
            {site.name} builds AI systems, websites and web applications, and manages
            servers, cloud and IT. Behind all of that sits a lot of work that is not code:
            explaining things clearly, designing interfaces people can use, and producing
            documents and visuals that hold up to scrutiny.
          </p>
          <p>The roles below cover those parts of the work.</p>
        </div>
      </Row>

      <Row
        id="roles"
        label="Roles"
        heading={<RowTitle id="roles">Three roles.</RowTitle>}
      >
        <div className="space-y-12">
          {roles.map((role) => (
            <article
              key={role.slug}
              aria-labelledby={`role-${role.slug}`}
              className="border-t border-ink pt-5"
            >
              <h3 id={`role-${role.slug}`} className="text-3xl leading-tight">
                {role.title}
              </h3>
              <p className="measure mt-3 text-ink-soft">{role.summary}</p>
              <div className="mt-6 grid gap-8 lg:grid-cols-3">
                <div>
                  <h4 className="eyebrow">You will work on</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
                    {role.youWillWorkOn.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="eyebrow">You will learn</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
                    {role.youWillLearn.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="eyebrow">Likely a good fit if</h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
                    {role.goodFit.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Row>

      <Row
        id="terms"
        label="Details"
        heading={<RowTitle id="terms">Hours and arrangements.</RowTitle>}
      >
        <p className="measure text-ink-soft">
          Details such as hours and the terms of the arrangement are shared with
          applicants, so that they can be explained properly and fit the role. Ask
          anything you like before you decide.
        </p>
      </Row>

      <Row
        id="apply"
        label="Apply"
        heading={<RowTitle id="apply">Tell us about yourself.</RowTitle>}
      >
        <div className="measure">
          <p className="mb-8 text-ink-soft">
            Choose a role and send a short message. A link to your work helps, whether
            that is a portfolio, GitHub or LinkedIn. No resume upload is needed at this
            stage. Prefer email? Write to{" "}
            <a className="link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            . We use your details to consider your application; see the{" "}
            <Link className="link" href="/privacy">
              privacy notice
            </Link>
            .
          </p>
          <ApplyForm />
        </div>
      </Row>
    </>
  );
}
