import { authorPath, type Author } from "./authors";
import { absoluteUrl, seo } from "./seo";
import { site } from "./site";

/**
 * Typed, pure JSON-LD builders. Every value must match what the page shows: build the
 * data from the same content the page renders, and never add ratings, reviews, prices,
 * clients or dates that are not real.
 */

export type JsonLdNode = Record<string, unknown>;

const CONTEXT = "https://schema.org";
const TZ = "America/Toronto";

/**
 * Date-only values ("2026-11-02") become midnight in Toronto with the correct UTC offset
 * for that day, e.g. "2026-11-02T00:00:00-05:00". Values that already carry a time zone
 * pass through unchanged.
 */
export function isoWithOffset(input: string): string {
  if (/(Z|[+-]\d{2}:\d{2})$/.test(input)) return input;
  const date = input.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Not an ISO date: ${input}`);
  // 05:00 UTC is local midnight in winter (EST) and 01:00 in summer (EDT): both are on
  // the same side of the 02:00 changeover as local midnight itself.
  const probe = new Date(`${date}T05:00:00Z`);
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value; // "GMT-05:00"
  const offset = !part || part === "GMT" ? "+00:00" : part.replace("GMT", "");
  return `${date}T00:00:00${offset}`;
}

export const organizationId = () => `${absoluteUrl("/")}/#organization`;

/** Compact Organization reference for publisher/provider/worksFor fields. */
export function organizationRef(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(site.logoPath),
  };
}

/**
 * Organization. No sameAs, ratings, reviews or foundingDate on purpose.
 * TODO(owner): add `sameAs` with the company LinkedIn page, Google Business Profile,
 * Clutch and similar profile URLs once they exist (see docs/seo/IMPLEMENTATION.md).
 */
export function organization(): JsonLdNode {
  return {
    "@context": CONTEXT,
    ...organizationRef(),
    description: site.description,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.locality,
      addressRegion: site.region,
      addressCountry: "CA",
    },
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: site.email },
    ],
  };
}

export function website(): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}/#website`,
    name: site.name,
    url: absoluteUrl("/"),
    inLanguage: seo.locale,
    publisher: { "@id": organizationId() },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbList(items: Crumb[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** areaServed is omitted on purpose: we have not decided the service area. */
export function service(input: {
  name: string;
  serviceType: string;
  description: string;
  path: string;
}): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "Service",
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: organizationRef(),
  };
}

export const personId = (a: Pick<Author, "slug">) =>
  `${absoluteUrl(authorPath(a))}#person`;

export function personRef(a: Author): JsonLdNode {
  return {
    "@type": "Person",
    "@id": personId(a),
    name: a.name,
    url: absoluteUrl(authorPath(a)),
    sameAs: [a.linkedin, a.github],
  };
}

export function person(a: Author, withContext = true): JsonLdNode {
  return {
    ...(withContext ? { "@context": CONTEXT } : {}),
    ...personRef(a),
    jobTitle: a.jobTitle,
    worksFor: organizationRef(),
    description: a.bio,
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: a.credential.name,
      recognizedBy: { "@type": "Organization", name: a.credential.issuer },
    },
  };
}

export function profilePage(a: Author): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(authorPath(a))}#profile`,
    url: absoluteUrl(authorPath(a)),
    name: a.name,
    inLanguage: seo.locale,
    mainEntity: person(a, false),
  };
}

export function article(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  author: Author;
  /** Absolute URL or site path of the share image. */
  image: string;
  wordCount?: number;
}): JsonLdNode {
  const url = absoluteUrl(input.path);
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: isoWithOffset(input.datePublished),
    dateModified: isoWithOffset(input.dateModified),
    inLanguage: seo.locale,
    author: personRef(input.author),
    publisher: organizationRef(),
    image: [input.image.startsWith("http") ? input.image : absoluteUrl(input.image)],
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
  };
}

export type FaqEntry = { q: string; a: string };

/** The questions and answers must be the ones visible on the page. */
export function faqPage(items: FaqEntry[]): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function webApplication(input: {
  name: string;
  path: string;
  description: string;
  dateModified: string;
  author: Author;
}): JsonLdNode {
  return {
    "@context": CONTEXT,
    "@type": "WebApplication",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: seo.locale,
    isAccessibleForFree: true,
    dateModified: isoWithOffset(input.dateModified),
    offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
    publisher: organizationRef(),
    author: personRef(input.author),
  };
}
