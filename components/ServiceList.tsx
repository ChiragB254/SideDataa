import Link from "next/link";
import { services } from "@/content/services";

export function ServiceList() {
  return (
    <ol className="border-b border-rule">
      {services.map((s, i) => (
        <li key={s.slug} className="border-t border-rule first:border-t-0">
          <Link
            href={`/services/${s.slug}`}
            className="group grid gap-x-8 gap-y-1 py-6 sm:grid-cols-[3rem_1fr] md:grid-cols-[3rem_minmax(0,18rem)_1fr] md:items-baseline"
          >
            <span
              className="font-serif text-lg text-muted tabular-nums"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-serif text-2xl leading-snug text-ink underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 group-hover:decoration-accent">
              {s.title}
            </span>
            <span className="text-ink-soft sm:col-start-2 md:col-start-3">
              {s.summary}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
