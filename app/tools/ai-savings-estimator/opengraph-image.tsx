import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt =
  "AI savings and growth estimator from SideData Technologies: what AI could save, and when it pays back.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    headline: "Estimate what AI could save, and when it pays back.",
    sub: "A free planning calculator",
  });
}
