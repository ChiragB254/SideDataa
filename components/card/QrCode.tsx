import { qrCodes } from "@/content/generated/qr";

/**
 * Inline SVG QR code from build-time data (content/generated/qr.ts, made by
 * `npm run cards:qr`). Decorative: the URL beside it is the accessible equivalent.
 * No client JavaScript, no data URI, no external request.
 */
export function QrCode({ slug, className = "" }: { slug: string; className?: string }) {
  const qr = qrCodes[slug];
  if (!qr) {
    throw new Error(`No QR code for card "${slug}". Run: npm run cards:qr`);
  }
  return (
    <svg
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <rect width={qr.size} height={qr.size} fill="var(--color-paper)" />
      <path d={qr.path} fill="var(--color-ink)" />
    </svg>
  );
}
