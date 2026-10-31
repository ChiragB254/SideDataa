import type { Heading } from "@/lib/markdown";

export const TOC_MIN_HEADINGS = 3;

/** Table of contents (a navigation landmark), shown for posts with three or more h2s. */
export function Toc({ headings }: { headings: Heading[] }) {
  const h2s = headings.filter((h) => h.depth === 2);
  if (h2s.length < TOC_MIN_HEADINGS) return null;
  return (
    <nav
      aria-labelledby="toc-label"
      className="measure mb-10 border border-rule bg-wash px-5 py-4"
    >
      <p id="toc-label" className="eyebrow">
        On this page
      </p>
      <ol className="mt-2">
        {h2s.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="link inline-flex min-h-11 items-center">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
