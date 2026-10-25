/*
 * Brand artwork as plain SVG strings, for places React components cannot reach:
 * the Open Graph images (next/og) and the print cards (HTML rendered by Chromium).
 *
 * Both functions mirror the website's marks:
 *   logoMarkSvg  <-  components/Logo.tsx (LogoMark) and public/logo-mark.svg
 *   heroArtSvg   <-  components/illustrations/HeroIllustration.tsx (same geometry,
 *                    static, no draw-in animation)
 *
 * TODO(owner): the logo is a placeholder. When a real logo arrives, replace
 * components/Logo.tsx (website and digital card) and logoMarkSvg / wordmark below
 * (print and share images). docs/CARDS.md lists every place.
 */

export const brand = {
  paper: "#faf9f6",
  ink: "#1b1f23",
  inkSoft: "#3f464d",
  muted: "#5a6168",
  rule: "#d8d4ca",
  accent: "#2f5d62",
  /** Wordmark as the site sets it: serif "SideData" plus small caps-style "Technologies". */
  wordmark: { primary: "SideData", secondary: "Technologies" },
} as const;

/** The square mark: outlined square with a solid accent block on the left. */
export function logoMarkSvg({
  ink = brand.ink,
  accent = brand.accent,
}: { ink?: string; accent?: string } = {}): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect x="2" y="2" width="28" height="28" fill="none" stroke="${ink}" stroke-width="2"/>` +
    `<rect x="2" y="2" width="10" height="28" fill="${accent}"/></svg>`
  );
}

/**
 * The home-page diagram: server stack, document, AI node, cloud and dashed
 * connections. Thin line, round caps. `line` is the main stroke, `accent` the highlights,
 * `fill` fills the small node discs (use the background colour).
 */
export function heroArtSvg({
  line = brand.inkSoft,
  accent = brand.accent,
  fill = brand.paper,
  strokeWidth = 1.5,
}: { line?: string; accent?: string; fill?: string; strokeWidth?: number } = {}): string {
  const servers = [270, 310, 350]
    .map(
      (y, i) =>
        `<rect x="40" y="${y}" width="130" height="34" rx="3"/>` +
        `<circle cx="56" cy="${y + 17}" r="3"${i === 0 ? ` stroke="${accent}"` : ""}/>` +
        `<circle cx="70" cy="${y + 17}" r="3"/>` +
        `<path d="M92 ${y + 17}h58"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 440" fill="none" stroke="${line}" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
    // cloud
    `<path d="M360 120C335 120 330 90 356 84C356 58 394 48 412 72C426 52 466 60 466 90C492 90 498 120 470 120Z"/>` +
    `<path stroke="${accent}" d="M414 108V86M404 96l10-10 10 10"/>` +
    // server stack
    servers +
    `<path d="M52 384v10M158 384v10M36 394h146"/>` +
    // document
    `<rect x="210" y="190" width="100" height="130" rx="4"/>` +
    `<path d="M226 226h60M226 244h68M226 262h52M226 280h64"/>` +
    // AI node
    `<circle cx="310" cy="190" r="34" fill="${fill}" stroke="${accent}"/>` +
    `<g stroke="${accent}"><path d="M298 182h24M298 182l12 20M322 182l-12 20"/>` +
    `<circle cx="298" cy="182" r="4"/><circle cx="322" cy="182" r="4"/><circle cx="310" cy="202" r="4"/></g>` +
    // connectors
    `<path d="M170 287H210"/><circle cx="170" cy="287" r="4" fill="${fill}"/>` +
    `<path stroke="${accent}" stroke-dasharray="4 5" d="M336 168C360 150 400 150 412 122"/>` +
    `<path stroke-dasharray="4 5" d="M470 120C490 150 500 180 494 214"/>` +
    `<circle cx="494" cy="226" r="12" fill="${fill}"/><circle cx="494" cy="226" r="3"/>` +
    `<path stroke-dasharray="4 5" d="M310 320V372H368"/>` +
    `<rect x="368" y="360" width="24" height="24" rx="3" fill="${fill}"/><path d="M375 372h10"/>` +
    // left nodes
    `<circle cx="90" cy="110" r="16" fill="${fill}"/><circle cx="90" cy="110" r="4"/>` +
    `<path d="M106 110H192"/><circle cx="200" cy="110" r="8" fill="${fill}"/>` +
    `<path stroke-dasharray="4 5" d="M206 116C250 140 270 160 282 176"/>` +
    `<path stroke-dasharray="1 7" d="M40 420h480"/>` +
    `</svg>`
  );
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
