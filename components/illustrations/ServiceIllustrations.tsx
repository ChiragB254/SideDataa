import type { ReactNode } from "react";
import type { ServiceSlug } from "@/content/services";

/*
 * Thin-line service illustrations. Decorative: the service title is always
 * next to them as text. Colours come only from the palette (currentColor for
 * ink, the accent token for highlights).
 */
function Frame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
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

function Ai() {
  return (
    <>
      <rect x="20" y="34" width="52" height="68" rx="3" />
      <path d="M30 52h32M30 62h32M30 72h32M30 82h20" />
      <path d="M72 68h28" strokeDasharray="3 4" />
      <circle cx="130" cy="68" r="30" className={A} />
      <path d="M118 58h24M118 58l12 20M142 58l-12 20" className={A} />
      <circle cx="118" cy="58" r="3.5" className={A} />
      <circle cx="142" cy="58" r="3.5" className={A} />
      <circle cx="130" cy="78" r="3.5" className={A} />
      <path d="M160 68h18" strokeDasharray="3 4" />
      <rect x="178" y="48" width="44" height="40" rx="4" />
      <path d="M190 68l6 6 12-12" className={A} />
      <path d="M20 128h202" strokeDasharray="1 6" />
      <path d="M20 122v12M72 124v8M130 124v8M222 122v12" />
    </>
  );
}

function Web() {
  return (
    <>
      <rect x="28" y="22" width="184" height="116" rx="4" />
      <path d="M28 44h184" />
      <circle cx="40" cy="33" r="2.5" />
      <circle cx="50" cy="33" r="2.5" />
      <circle cx="60" cy="33" r="2.5" />
      <rect x="78" y="28" width="96" height="10" rx="5" />
      <path d="M44 62h66M44 74h48" />
      <rect x="44" y="88" width="38" height="14" rx="2" className={A} />
      <rect x="130" y="56" width="64" height="46" rx="2" />
      <path d="M130 102l22-24 14 14 10-10 18 20" />
      <circle cx="176" cy="70" r="4" />
      <path d="M44 114h40M96 114h40M148 114h46" />
      <path d="M176 100v22l5-5 4 9 4-2-4-9h7z" className={A} fill="var(--color-paper)" />
    </>
  );
}

function Server() {
  return (
    <>
      {[24, 62, 100].map((y, i) => (
        <g key={y}>
          <rect x="40" y={y} width="120" height="30" rx="3" />
          <circle cx="54" cy={y + 15} r="2.5" className={i === 0 ? A : undefined} />
          <circle cx="66" cy={y + 15} r="2.5" />
          <path d={`M84 ${y + 15}h56M84 ${y + 9}h30`} />
        </g>
      ))}
      <path d="M160 77h22" strokeDasharray="3 4" />
      <rect x="182" y="56" width="40" height="42" rx="3" />
      <path d="M187 82h7l4-12 6 24 4-12h11" className={A} />
      <path d="M52 130v10M148 130v10M28 140h144" />
      <path d="M182 118h40M182 126h24" strokeDasharray="1 6" />
    </>
  );
}

function Cloud() {
  return (
    <>
      <path
        d="M62 84C42 84 36 58 58 54C58 34 90 26 104 44C116 28 148 34 148 56C168 56 174 84 152 84Z"
        transform="translate(16 0)"
      />
      <path d="M112 62l-8 8 8 8M136 62l8 8-8 8M127 60l-6 20" className={A} />
      <path d="M88 84v34M128 84v34M168 84v34" />
      <rect x="74" y="118" width="28" height="20" rx="2" />
      <rect x="114" y="118" width="28" height="20" rx="2" />
      <rect x="154" y="118" width="28" height="20" rx="2" />
      <path d="M128 100l-4-5M128 100l4-5" className={A} />
      <path d="M20 148h202" strokeDasharray="1 6" />
      <path d="M200 40h22M204 50h18" strokeDasharray="1 6" />
    </>
  );
}

function It() {
  return (
    <>
      <rect x="32" y="36" width="92" height="60" rx="3" />
      <path d="M22 96h112l-6 12H28z" />
      <path d="M46 52h40M46 62h28M46 72h34" />
      <path d="M124 66h34" strokeDasharray="3 4" />
      <path d="M186 30l28 10v28c0 18-14 28-28 34-14-6-28-16-28-34V40z" className={A} />
      <path d="M173 66l9 9 15-17" className={A} />
      <path d="M78 108v26M186 102v32M44 134h172" />
      <circle cx="44" cy="134" r="4" fill="var(--color-paper)" />
      <circle cx="116" cy="134" r="4" fill="var(--color-paper)" />
      <circle cx="216" cy="134" r="4" fill="var(--color-paper)" />
      <path d="M116 138v8" />
    </>
  );
}

const map: Record<ServiceSlug, () => ReactNode> = {
  "ai-development": Ai,
  "web-development": Web,
  "server-management": Server,
  "cloud-services": Cloud,
  "it-services": It,
};

export function ServiceIllustration({
  slug,
  className = "h-auto w-full",
}: {
  slug: ServiceSlug;
  className?: string;
}) {
  const Art = map[slug];
  return (
    <Frame className={`text-ink-soft ${className}`}>
      <Art />
    </Frame>
  );
}
