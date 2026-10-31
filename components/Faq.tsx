import { JsonLd } from "@/components/JsonLd";
import { faqPage } from "@/lib/jsonld";

export type FaqProps = {
  items: { q: string; a: string; aHtml?: string }[];
  /** Heading level of each question. Use 3 under an h2 section heading. */
  level?: 3 | 4;
  /** Emit FAQPage JSON-LD from the same items. On by default. */
  jsonLd?: boolean;
};

/**
 * Visible Q&A (always expanded, no JavaScript) that also feeds FAQPage JSON-LD, so the
 * markup matches the page by construction. Google no longer shows FAQ rich results,
 * but the visible questions help readers and answer engines.
 *
 * `aHtml` (rendered Markdown from our own posts) is shown when given; `a` is always the
 * plain-text answer used for JSON-LD.
 */
export function Faq({ items, level = 3, jsonLd = true }: FaqProps) {
  const H = `h${level}` as "h3" | "h4";
  return (
    <div className="measure border-b border-rule" data-faq>
      {jsonLd ? <JsonLd data={faqPage(items)} /> : null}
      {items.map((f) => (
        <div key={f.q} className="border-t border-rule py-5">
          <H className="font-serif text-xl leading-snug" data-faq-q>
            {f.q}
          </H>
          {f.aHtml ? (
            <div
              className="prose-copy mt-2 text-ink-soft"
              data-faq-a
              dangerouslySetInnerHTML={{ __html: f.aHtml }}
            />
          ) : (
            <p className="mt-2 text-ink-soft" data-faq-a>
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
