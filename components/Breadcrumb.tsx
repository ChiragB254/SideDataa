import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Visible breadcrumb trail. The last item is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap gap-x-2 text-sm text-muted">
        {items.map((c, i) => (
          <li key={c.label} className="inline-flex items-center gap-2">
            {c.href ? (
              <Link href={c.href} className="link inline-flex min-h-11 items-center">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
            {i < items.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
