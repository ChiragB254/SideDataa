export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="2" y="2" width="10" height="28" fill="var(--color-accent)" />
    </svg>
  );
}

/** Wordmark: square mark plus company name set in the heading serif. */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-serif text-[1.3125rem] leading-none font-medium tracking-tight">
        SideData
        <span className="ml-1 font-sans text-[0.6875rem] font-medium tracking-[0.14em] text-muted uppercase">
          Technologies
        </span>
      </span>
    </span>
  );
}
