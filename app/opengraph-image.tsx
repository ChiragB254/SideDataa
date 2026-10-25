import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "SideData Technologies: AI, web, servers and cloud. Toronto, Ontario.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    headline: "AI, web, servers and cloud. Toronto, Ontario.",
  });
}
