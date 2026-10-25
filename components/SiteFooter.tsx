import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { services } from "@/content/services";
import { site } from "@/lib/site";

const linkClass =
  "inline-flex min-h-11 max-w-full items-center [overflow-wrap:anywhere] text-ink-soft underline-offset-4 hover:text-accent hover:underline";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-wash">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-4 max-w-sm text-[0.9375rem] text-ink-soft">
              An IT company in {site.locationLabel}. We build AI systems, websites and web
              applications, and we look after servers, cloud and everyday IT.
            </p>
            <p className="mt-4 text-[0.9375rem]">
              <a className="link" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </p>
          </div>

          <nav aria-labelledby="footer-services" className="md:col-span-3">
            <h2 id="footer-services" className="eyebrow !font-sans">
              Services
            </h2>
            <ul className="mt-2">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link className={linkClass} href={`/services/${s.slug}`}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company" className="md:col-span-2">
            <h2 id="footer-company" className="eyebrow !font-sans">
              Company
            </h2>
            <ul className="mt-2">
              <li>
                <Link className={linkClass} href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/careers">
                  Careers
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/contact">
                  Contact
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/card">
                  Digital card
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal" className="md:col-span-2">
            <h2 id="footer-legal" className="eyebrow !font-sans">
              Legal
            </h2>
            <ul className="mt-2">
              <li>
                <Link className={linkClass} href="/privacy">
                  Privacy
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/terms">
                  Terms
                </Link>
              </li>
              <li>
                <Link className={linkClass} href="/accessibility">
                  Accessibility
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-12 border-t border-rule pt-6 text-sm text-muted">
          &copy; {new Date().getFullYear()} {site.name}. {site.locationLabel}.
        </p>
      </Container>
    </footer>
  );
}
