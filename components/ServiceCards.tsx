import Link from "next/link";
import { services } from "@/content/services";
import { ServiceIllustration } from "./illustrations/ServiceIllustrations";

export function ServiceCards() {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s, i) => (
        <li key={s.slug} className="card flex min-w-0 flex-col">
          <div className="art-panel bg-dots border-0 border-b p-5">
            <ServiceIllustration slug={s.slug} />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="font-serif text-sm text-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-1 text-2xl leading-snug">
              <Link
                href={`/services/${s.slug}`}
                className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 after:absolute after:inset-0 hover:decoration-accent"
              >
                {s.title}
              </Link>
            </h3>
            <p className="mt-2 flex-1 break-words text-ink-soft">{s.summary}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 font-medium text-accent">
              Read more
              <svg
                viewBox="0 0 16 16"
                className="card-arrow h-3.5 w-3.5"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M2 8h11M9 3.5 13.5 8 9 12.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </p>
          </div>
        </li>
      ))}
      <li className="flex flex-col justify-center border border-dashed border-muted p-5">
        <h3 className="text-2xl leading-snug">Not sure where it fits?</h3>
        <p className="mt-2 text-ink-soft">
          Many needs sit between two areas. Tell us what you are trying to get done.
        </p>
        <p className="mt-3">
          <Link
            href="/contact"
            className="link inline-flex min-h-11 items-center font-medium"
          >
            Contact us
          </Link>
        </p>
      </li>
    </ul>
  );
}
