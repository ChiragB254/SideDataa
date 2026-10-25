import type { Metadata } from "next";
import { site } from "./site";

/** The site-wide share image (app/opengraph-image.tsx). */
const defaultImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name}: AI, web, servers and cloud. Toronto, Ontario.`,
};

/**
 * Per-page metadata with canonical URL and Open Graph/Twitter fields.
 *
 * Share image: a page's own `opengraph-image.tsx` is picked up automatically, so pass
 * `ownImage: true` for those routes (careers, card). Every other page gets the
 * site-wide image; declaring openGraph here would otherwise drop the layout's image.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  ownImage = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ownImage?: boolean;
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
      ...(ownImage ? {} : { images: [defaultImage] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      ...(ownImage ? {} : { images: [defaultImage] }),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
