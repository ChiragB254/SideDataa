import type { JsonLdNode } from "@/lib/jsonld";

/** Renders one JSON-LD block. The data is our own constants; "<" is escaped defensively. */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
