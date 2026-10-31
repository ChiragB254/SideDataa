import { Faq } from "@/components/Faq";
import type { RenderedMarkdown } from "@/lib/markdown";

/** Renders a post's Markdown segments. Server component: no client JavaScript. */
export function PostBody({ rendered }: { rendered: RenderedMarkdown }) {
  return (
    <div className="post-body">
      {rendered.segments.map((seg, i) => {
        switch (seg.type) {
          case "md":
            return (
              <div
                key={i}
                className="prose-copy text-ink-soft"
                dangerouslySetInnerHTML={{ __html: seg.html }}
              />
            );
          case "takeaways":
            return (
              <section
                key={i}
                aria-labelledby="key-takeaways-label"
                className="mb-10 border-l-4 border-accent bg-tint px-5 py-4"
              >
                <p id="key-takeaways-label" className="eyebrow">
                  Key takeaways
                </p>
                <div
                  className="prose-copy mt-2 text-ink"
                  dangerouslySetInnerHTML={{ __html: seg.html }}
                />
              </section>
            );
          case "callout":
            return (
              <div
                key={i}
                role="note"
                className={`my-8 border-l-4 px-5 py-4 ${
                  seg.variant === "caution"
                    ? "border-danger bg-wash"
                    : "border-rule-strong bg-wash"
                }`}
              >
                <p className="eyebrow !text-ink-soft">
                  {seg.variant === "caution" ? "Caution" : "Note"}
                  {seg.title ? `: ${seg.title}` : ""}
                </p>
                <div
                  className="prose-copy mt-2 text-ink"
                  dangerouslySetInnerHTML={{ __html: seg.html }}
                />
              </div>
            );
          case "faq":
            // JSON-LD is emitted once per post by the page, from all FAQ items together.
            return (
              <div key={i} className="mt-4">
                <Faq
                  items={seg.items.map((f) => ({ q: f.q, a: f.aText, aHtml: f.aHtml }))}
                  jsonLd={false}
                />
              </div>
            );
        }
      })}
    </div>
  );
}
