import type { ReactNode } from "react";
import { Container } from "./Container";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">Legal</p>
        <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">{title}</h1>
        <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>
        <div className="prose-copy measure mt-10 text-ink-soft">{children}</div>
      </Container>
    </section>
  );
}
