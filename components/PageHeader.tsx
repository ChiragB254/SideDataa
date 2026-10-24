import type { ReactNode } from "react";
import { Container } from "./Container";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-6 max-w-[22ch] text-5xl leading-[1.1] md:text-6xl">{title}</h1>
        {children ? (
          <div className="mt-8 max-w-xl space-y-4 text-lg text-ink-soft">{children}</div>
        ) : null}
      </Container>
    </section>
  );
}
