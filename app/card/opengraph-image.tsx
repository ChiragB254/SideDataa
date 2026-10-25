import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt = "SideData Technologies: digital card";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    headline: "SideData Technologies: digital card",
    sub: "support@sidedataa.com",
  });
}
