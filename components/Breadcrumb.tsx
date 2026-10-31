import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbList } from "@/lib/jsonld";

/** `href` is the page's site path. The last item is the current page and is not a link. */
export type Crumb = { label: string; href: string };

/**
 * Visible breadcrumb trail plus matching BreadcrumbList JSON-LD, built from the same
 * items so the markup can never disagree with what is shown.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd
        data={breadcrumbList(items.map((c) => ({ name: c.label, path: c.href })))}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-x-2 text-sm text-muted">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.href} className="inline-flex items-center gap-2">
                {last ? (
                  <span aria-current="page">{c.label}</span>
                ) : (
                  <Link href={c.href} className="link inline-flex min-h-11 items-center">
                    {c.label}
                  </Link>
                )}
                {last ? null : <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
