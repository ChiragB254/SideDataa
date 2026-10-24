import type { Metadata } from "next";
import { site } from "./site";

/** Per-page metadata with canonical URL and Open Graph/Twitter fields. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_CA",
      title: `${title} | ${site.name}`,
      description,
      url: path,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
