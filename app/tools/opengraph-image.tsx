import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "SideData Technologies: free tools for planning AI and IT work.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    headline: "Free tools for planning AI and IT work.",
    sub: "Run in your browser",
  });
}
