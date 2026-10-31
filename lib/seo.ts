import type { Metadata } from "next";
import { hasPublishedPosts } from "./blog";
import { site } from "./site";

/**
 * Shared SEO module: one source of truth for site-wide metadata defaults.
 * JSON-LD builders live in lib/jsonld.ts.
 */

export const seo = {
  siteName: site.name,
  defaultTitle: `${site.name} | AI, web, servers and cloud, Toronto`,
  titleTemplate: `%s | ${site.name}`,
  description: site.description,
  /** Language of the site (html lang and JSON-LD inLanguage). */
  locale: "en-CA",
  /** Open Graph locale. */
  ogLocale: "en_CA",
  feedPath: "/feed.xml",
} as const;

/** Absolute URL for a site path. Pass "/" for the home page (no trailing slash is added). */
export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/+$/, "");
  if (path === "/" || path === "") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The site-wide share image (app/opengraph-image.tsx). */
export const defaultOgImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name}: AI, web, servers and cloud. Toronto, Ontario.`,
};

export type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Search Console / Bing Webmaster verification.
 * TODO(owner): paste the tokens here, or set GOOGLE_SITE_VERIFICATION and
 * BING_SITE_VERIFICATION in the build environment. Empty means no tag is emitted.
 */
const verificationTokens = { google: "", bing: "" };

function verification(): Pick<Metadata, "verification"> {
  const google = process.env.GOOGLE_SITE_VERIFICATION || verificationTokens.google;
  const bing = process.env.BING_SITE_VERIFICATION || verificationTokens.bing;
  if (!google && !bing) return {};
  return {
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { "msvalidate.01": bing } } : {}),
    },
  };
}

/** RSS discovery link, only once the blog has published posts. */
function feedAlternates(): Record<string, string> {
  return hasPublishedPosts() ? { "application/rss+xml": seo.feedPath } : {};
}

/** Metadata for the root layout: metadataBase, title template and site-wide defaults. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(site.url),
    title: { default: seo.defaultTitle, template: seo.titleTemplate },
    description: seo.description,
    applicationName: site.name,
    alternates: { canonical: "/", types: feedAlternates() },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: seo.ogLocale,
      title: site.name,
      description: seo.description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: site.name,
      description: seo.description,
    },
    ...verification(),
  };
}

export type PageMetadataInput = {
  /** Page title without the brand; the layout's template appends " | SideData Technologies". */
  title: string;
  description: string;
  /** Site-relative path, e.g. "/services". Becomes the self-referencing absolute canonical. */
  path: string;
  /** Override the share image. Defaults to the site-wide image. */
  image?: OgImage;
  /** Open Graph type. "article" is implied when publishedTime is given. */
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  /**
   * The route has its own `opengraph-image.tsx` (careers, card, tools): leave images out so
   * Next.js uses that file.
   */
  ownImage?: boolean;
  /** ISO 8601 with time zone offset. Only pass real dates. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Absolute author page URLs (Open Graph article:author). */
  authors?: string[];
};

/**
 * Per-page metadata: canonical, Open Graph, Twitter and robots.
 *
 * A child's `openGraph` / `twitter` / `alternates` REPLACES the parent's object (Next.js
 * merges shallowly), so each one is built completely here every time.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type,
  noindex = false,
  ownImage = false,
  publishedTime,
  modifiedTime,
  authors,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} | ${site.name}`;
  const images = ownImage ? undefined : [image ?? defaultOgImage];
  const ogType = type ?? (publishedTime ? "article" : "website");
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical, types: feedAlternates() },
    openGraph: {
      type:
        ogType === "profile" ? "profile" : ogType === "article" ? "article" : "website",
      siteName: site.name,
      locale: seo.ogLocale,
      title: fullTitle,
      description,
      url: canonical,
      ...(images ? { images } : {}),
      ...(ogType === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors } : {}),
          }
        : {}),
    } as NonNullable<Metadata["openGraph"]>,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
