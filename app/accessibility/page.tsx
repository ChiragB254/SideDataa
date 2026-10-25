import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

/*
 * NOTE(owner): plain-language draft; have it reviewed by a lawyer. Update the
 * "How we check" section if you commission a manual audit, and keep the
 * "Known limitations" list current. Do not claim conformance you have not
 * verified.
 *
 * TODO(owner): run a manual keyboard and screen reader pass (VoiceOver on macOS and
 * iOS, NVDA on Windows) over every page, especially the home page carousel and the
 * forms, before claiming conformance. Then update "How we check" below.
 */
export const metadata = pageMetadata({
  title: "Accessibility statement",
  description:
    "How SideData Technologies approaches accessibility on this website, and how to report a problem.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility statement" updated="October 25, 2026">
      <p>
        We want everyone to be able to use this website. Our target is the Web Content
        Accessibility Guidelines (WCAG) 2.2, level AA.
      </p>

      <h2>What we have done</h2>
      <ul>
        <li>
          Semantic page structure with landmarks, one main heading per page and a skip
          link.
        </li>
        <li>
          Full keyboard operation, including the mobile menu and the services carousel,
          with visible focus indicators.
        </li>
        <li>
          The services carousel never moves on its own. Previous, next and slide buttons
          do everything swiping does, and slides that are not showing are hidden from
          keyboard and screen reader navigation.
        </li>
        <li>Text and interface colours chosen for sufficient contrast.</li>
        <li>
          Form fields with visible labels, instructions, and error messages tied to each
          field.
        </li>
        <li>
          Layouts that adapt to small screens and larger text sizes, without sideways
          scrolling down to a 320 pixel wide screen.
        </li>
        <li>
          Illustrations are decorative and hidden from assistive technology. Animation is
          limited to a short line drawing on the home page, and it is switched off when
          your system asks for reduced motion.
        </li>
      </ul>

      <h2>How we check</h2>
      <p>
        This site is built to meet WCAG 2.2 level AA. Automated accessibility checks
        (axe-core) and browser tests for keyboard use, reflow at 320 pixels, target size
        and reduced motion run against the site as part of our test suite. Automated tests
        find only some problems, and some criteria can only be checked by a person. We
        have not yet completed a manual check with assistive technology and have not
        commissioned an independent audit, so we do not claim conformance or
        certification.
      </p>

      <h2>Known limitations</h2>
      <p>
        We are not aware of specific barriers at the time of writing. If you find one,
        please tell us.
      </p>

      <h2>Tell us about a problem</h2>
      <p>
        If something on this site is hard to use, or you need information in another
        format, email <a href={`mailto:${site.email}`}>{site.email}</a> with the page
        address and a short description. We will look into it.
      </p>
    </LegalPage>
  );
}
