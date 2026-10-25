import { ogContentType, ogSize, renderOgImage } from "@/lib/og";

export const alt =
  "SideData Technologies careers: do real work, and learn how it is done properly. Unpaid internships in India.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgImage({
    headline: "Do real work, and learn how it is done properly.",
    sub: "Unpaid internships in India",
  });
}
