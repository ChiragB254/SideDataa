import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/*
 * NOTE(owner): plain-language draft, not legal advice. Have a lawyer
 * licensed in Ontario review it before launch. Client work should be
 * governed by a separate written agreement.
 */
export const metadata = pageMetadata({
  title: "Terms of use",
  description: "Terms for using the SideData Technologies website.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="October 24, 2026">
      <p>
        These terms apply to your use of the {site.name} website. By using the site you
        agree to them. If you do not agree, please do not use the site.
      </p>

      <h2>About this website</h2>
      <p>
        The website describes our services and lets you contact us. The information on it
        is general and may change. It is not a quote, offer or contract.
      </p>

      <h2>Our services</h2>
      <p>
        Work we do for clients is governed by a separate written agreement or statement of
        work agreed between you and us. If something in that agreement conflicts with
        these terms, the agreement applies.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not misuse the site: do not attempt to gain unauthorised access, interfere with
        its operation, send malicious or unlawful content through its forms, or use
        automated tools to submit spam.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The content, design and code of this website belong to {site.name} or its
        licensors. You may view and share links to pages, but you may not copy or reuse
        the content without permission.
      </p>

      <h2>No warranty and limits of liability</h2>
      <p>
        The site is provided as is. We take care to keep it accurate and available, but we
        do not promise that it will be error-free or uninterrupted. To the extent
        permitted by law, we are not liable for loss arising from your use of the website.
        Nothing in these terms limits liability that cannot be limited under applicable
        law.
      </p>

      <h2>Links to other sites</h2>
      <p>We are not responsible for the content or practices of sites we link to.</p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Province of Ontario and the federal
        laws of Canada that apply there. Disputes are to be resolved in the courts of
        Ontario.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
