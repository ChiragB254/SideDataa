import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

/*
 * NOTE(owner): this is a plain-language draft, not legal advice. Have a
 * lawyer licensed in Ontario review it before launch, and confirm the
 * retention period, the service providers listed and whether you use any
 * analytics (none are installed in this codebase).
 *
 * TODO(owner): internship applicants will be in India, but this draft is written
 * for Canada (PIPEDA, Ontario). Have it reviewed against India's Digital Personal
 * Data Protection Act, 2023, and for the cross-border transfer of applications
 * between India and Canada.
 * TODO(owner): applications may be shared with the joint-venture partner, Right
 * Click Orbit (India). If that is true, this page must say so (what is shared,
 * why, and who it is shared with). The page does not currently say it.
 */
export const metadata = pageMetadata({
  title: "Privacy notice",
  description:
    "How SideData Technologies collects, uses and protects personal information submitted through this website.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy notice" updated="October 24, 2026">
      <p>
        This notice explains what personal information {site.name} collects through this
        website, why, and the choices you have. We are based in {site.locationLabel} and
        handle personal information in line with Canada&rsquo;s Personal Information
        Protection and Electronic Documents Act (PIPEDA) and applicable Ontario law.
      </p>

      <h2>What we collect</h2>
      <p>We collect only what you choose to send us through the website:</p>
      <ul>
        <li>
          <strong>Contact form:</strong> your name, email address, company (optional), the
          service you are interested in, and your message.
        </li>
        <li>
          <strong>Careers form:</strong> your name, email address, the role you are
          interested in, an optional link to your work, and your message.
        </li>
        <li>
          <strong>Email:</strong> anything you send to {site.email}.
        </li>
      </ul>
      <p>
        Our hosting provider and security tools may process technical information such as
        your IP address and browser type in server logs, so that the site stays available
        and secure. We do not use advertising cookies, and this website does not currently
        use analytics.
      </p>

      <h2>Why we use it</h2>
      <p>
        We use your information to reply to you, to discuss work with you, and to consider
        applications. We do not sell personal information and we do not use it for
        marketing without asking you first.
      </p>

      <h2>Who handles it</h2>
      <p>
        To run the website and deliver your message we use service providers who process
        data on our behalf: a web hosting provider, an email delivery service, and, where
        enabled, Cloudflare Turnstile to filter automated spam. Some of these providers
        store data outside Canada, including in the United States, where it may be
        accessible under local law.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiries and applications for as long as needed to respond and to
        consider the matter, and then delete them or keep them only as required by law or
        for legitimate business records. Ask us if you want yours removed sooner.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can ask to see the personal information we hold about you, ask us to correct
        it, ask us to delete it, or withdraw your consent to our use of it, subject to
        legal requirements. Email <a href={`mailto:${site.email}`}>{site.email}</a> and we
        will respond. If you are not satisfied, you may contact the Office of the Privacy
        Commissioner of Canada.
      </p>

      <h2>Security</h2>
      <p>
        The site is served over HTTPS and form submissions are limited to what is needed.
        No method of transmission or storage is completely secure, so we cannot guarantee
        absolute security.
      </p>

      <h2>Changes</h2>
      <p>If we change this notice, we will update the date at the top of this page.</p>
    </LegalPage>
  );
}
