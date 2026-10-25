/*
 * Abstract systems diagram: server stack, document and AI node, cloud, and
 * the connections between them. Decorative. Lines draw in once on load when
 * the visitor has not asked for reduced motion (see .draw in globals.css).
 */
const d = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

export function HeroIllustration({
  className = "h-auto w-full",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 560 440"
      className={`text-ink-soft ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* cloud */}
      <path
        pathLength={1}
        className="draw"
        style={d(0.1)}
        d="M360 120C335 120 330 90 356 84C356 58 394 48 412 72C426 52 466 60 466 90C492 90 498 120 470 120Z"
      />
      <path
        pathLength={1}
        className="draw stroke-accent"
        style={d(0.5)}
        d="M414 108V86M404 96l10-10 10 10"
      />

      {/* server stack */}
      {[270, 310, 350].map((y, i) => (
        <g key={y} className="fade-in" style={d(0.1 + i * 0.15)}>
          <rect x="40" y={y} width="130" height="34" rx="3" />
          <circle
            cx="56"
            cy={y + 17}
            r="3"
            className={i === 0 ? "stroke-accent" : undefined}
          />
          <circle cx="70" cy={y + 17} r="3" />
          <path d={`M92 ${y + 17}h58`} />
        </g>
      ))}
      <path d="M52 384v10M158 384v10M36 394h146" />

      {/* document */}
      <rect
        pathLength={1}
        className="draw"
        style={d(0.2)}
        x="210"
        y="190"
        width="100"
        height="130"
        rx="4"
      />
      <path
        d="M226 226h60M226 244h68M226 262h52M226 280h64"
        className="fade-in"
        style={d(0.6)}
      />

      {/* AI node */}
      <circle
        cx="310"
        cy="190"
        r="34"
        className="fade-in fill-paper stroke-accent"
        style={d(0.5)}
      />
      <g className="fade-in stroke-accent" style={d(0.7)}>
        <path d="M298 182h24M298 182l12 20M322 182l-12 20" />
        <circle cx="298" cy="182" r="4" />
        <circle cx="322" cy="182" r="4" />
        <circle cx="310" cy="202" r="4" />
      </g>

      {/* connectors */}
      <path pathLength={1} className="draw" style={d(0.4)} d="M170 287H210" />
      <circle cx="170" cy="287" r="4" className="fill-paper" />
      <path
        d="M336 168C360 150 400 150 412 122"
        strokeDasharray="4 5"
        className="fade-in stroke-accent"
        style={d(0.8)}
      />
      <path
        d="M470 120C490 150 500 180 494 214"
        strokeDasharray="4 5"
        className="fade-in"
        style={d(0.9)}
      />
      <circle cx="494" cy="226" r="12" className="fill-paper" />
      <circle cx="494" cy="226" r="3" />
      <path
        d="M310 320V372H368"
        strokeDasharray="4 5"
        className="fade-in"
        style={d(0.9)}
      />
      <rect x="368" y="360" width="24" height="24" rx="3" className="fill-paper" />
      <path d="M375 372h10" />

      {/* left nodes */}
      <circle cx="90" cy="110" r="16" className="fill-paper" />
      <circle cx="90" cy="110" r="4" />
      <path d="M106 110H192" pathLength={1} className="draw" style={d(0.3)} />
      <circle cx="200" cy="110" r="8" className="fill-paper" />
      <path
        d="M206 116C250 140 270 160 282 176"
        strokeDasharray="4 5"
        className="fade-in"
        style={d(0.8)}
      />

      <path d="M40 420h480" strokeDasharray="1 7" />
    </svg>
  );
}
