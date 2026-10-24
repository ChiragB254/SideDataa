import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

/*
 * NOTE(owner): plain-language draft; have it reviewed by a lawyer. Update the
 * "How we check" section if you commission a manual audit, and keep the
 * "Known limitations" list current. Do not claim conformance you have not
 * verified.
 */
export const metadata = pageMetadata({
  title: "Accessibility statement",
  description:
    "How SideData Technologies approaches accessibility on this website, and how to report a problem.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility statement" updated="October 24, 2026">
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
          Full keyboard operation, including the mobile menu, with visible focus
          indicators.
        </li>
        <li>Text and interface colours chosen for sufficient contrast.</li>
        <li>
          Form fields with visible labels, instructions, and error messages tied to each
          field.
        </li>
        <li>Layouts that adapt to small screens and larger text sizes.</li>
        <li>
          No autoplaying media, and animation is minimal and switched off when your system
          asks for reduced motion.
        </li>
      </ul>

      <h2>How we check</h2>
      <p>
        Automated accessibility checks (axe-core) run against every page as part of our
        test suite. Automated tests find only some problems. We have not yet commissioned
        an independent audit, so we do not claim full conformance.
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
