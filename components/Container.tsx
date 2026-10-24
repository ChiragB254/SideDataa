import type { ElementType, ReactNode } from "react";

export function Container({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</Tag>
  );
}

/**
 * Editorial row: a small label in the left rail, content on the right.
 * Each row is separated by a hairline rule.
 */
export function Row({
  label,
  id,
  children,
  heading,
  className = "",
}: {
  label?: string;
  id?: string;
  heading?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={`border-t border-rule py-12 md:py-16 ${className}`}
    >
      <Container>
        <div className="grid gap-6 md:grid-cols-12 md:gap-x-10">
          <div className="md:col-span-3">
            {label ? <p className="eyebrow">{label}</p> : null}
          </div>
          <div className="md:col-span-9">
            {heading}
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function RowTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id ? `${id}-title` : undefined}
      className="mb-8 max-w-[28ch] text-3xl leading-tight md:text-4xl"
    >
      {children}
    </h2>
  );
}
