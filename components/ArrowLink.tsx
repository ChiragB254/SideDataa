import Link from "next/link";
import type { ReactNode } from "react";

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="link inline-flex min-h-11 items-center gap-1.5 font-medium"
    >
      {children}
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
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
    </Link>
  );
}
