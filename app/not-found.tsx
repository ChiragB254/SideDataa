import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-6 max-w-[20ch] text-5xl leading-[1.1] md:text-6xl">
          That page does not exist.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-ink-soft">
          The address may be mistyped, or the page may have moved. Try one of these
          instead.
        </p>
        <ul className="mt-6 space-y-1">
          <li>
            <Link className="link inline-flex min-h-11 items-center" href="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="link inline-flex min-h-11 items-center" href="/services">
              Services
            </Link>
          </li>
          <li>
            <Link className="link inline-flex min-h-11 items-center" href="/contact">
              Contact
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
