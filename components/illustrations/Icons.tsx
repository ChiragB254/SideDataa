import type { ReactNode } from "react";

function Icon({
  children,
  className = "h-12 w-12",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`text-ink-soft ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const A = "stroke-accent";

/* Careers perks */
export function MentorshipIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="16" cy="16" r="6" />
      <path d="M6 38c0-7 4-11 10-11s10 4 10 11" />
      <circle cx="34" cy="20" r="4.5" className={A} />
      <path d="M28 38c.6-5 3-8 7-8s6 3 6.5 8" className={A} />
    </Icon>
  );
}
export function SubscriptionIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="6" y="9" width="36" height="26" rx="3" />
      <path d="M16 41h16M24 35v6" />
      <path d="M14 20l5 4-5 4" className={A} />
      <path d="M24 28h9" className={A} />
    </Icon>
  );
}
export function LetterIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M11 5h20l8 8v30H11z" />
      <path d="M31 5v8h8" />
      <path d="M17 21h16M17 27h16M17 33h8" />
      <circle cx="33" cy="35" r="5" className={A} />
      <path d="M31 39l-1 5 3-2 3 2-1-5" className={A} />
    </Icon>
  );
}

/* How we work, by step position */
export function DiscoverIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="21" cy="21" r="12" />
      <path d="M30 30l11 11" className={A} />
      <path d="M15 21h12M21 15v12" />
    </Icon>
  );
}
export function ScopeIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="9" y="6" width="30" height="36" rx="3" />
      <path d="M16 16l3 3 5-6" className={A} />
      <path d="M28 16h6M16 27l3 3 5-6" />
      <path d="M28 27h6" />
    </Icon>
  );
}
export function CycleIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M10 22a14 14 0 0 1 25-8" />
      <path d="M36 7v8h-8" className={A} />
      <path d="M38 26a14 14 0 0 1-25 8" />
      <path d="M12 41v-8h8" className={A} />
    </Icon>
  );
}
export function HandoverIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M7 18l17-9 17 9v16L24 43 7 34z" />
      <path d="M7 18l17 9 17-9M24 27v16" />
      <path d="M24 3v10M20 9l4 4 4-4" className={A} />
    </Icon>
  );
}

export function StepIcon({ index, className }: { index: number; className?: string }) {
  switch (index % 4) {
    case 0:
      return <DiscoverIcon className={className} />;
    case 1:
      return <ScopeIcon className={className} />;
    case 2:
      return <CycleIcon className={className} />;
    default:
      return <HandoverIcon className={className} />;
  }
}
