import { site } from "@/lib/site";

/**
 * Business cards: one source of truth.
 *
 * Everything is generated from this list: the digital pages (/card and
 * /card/<slug>), the vCards, the QR codes (content/generated/qr.ts) and the
 * print PDFs (design/cards/<slug>/). Adding a person is a data-only change:
 * add an entry below, then run `npm run cards:qr` and `npm run cards:print`.
 */

/**
 * The origin printed in QR codes and shown on cards. Fixed on purpose: a QR code
 * on paper is permanent, so it must not follow NEXT_PUBLIC_SITE_URL.
 */
export const cardOrigin = "https://sidedataa.com";

export const cardTagline = "AI, web, servers, cloud and IT in Toronto";

export type Card = {
  /** URL segment and file name stem. Lowercase letters, digits and hyphens. */
  slug: string;
  kind: "company" | "person";
  /** Company name for the company card; full name for a person. */
  name: string;
  /** Person only. */
  title?: string;
  email: string;
  /** Display format, e.g. "+1 437 431 3144". Person only. */
  phone?: string;
  /** Digits for tel: links and the vCard, e.g. "+14374313144". Required with phone. */
  phoneDial?: string;
  linkedin?: string;
};

export const slugPattern = /^[a-z0-9-]+$/;

export const cards: readonly Card[] = [
  {
    slug: "sidedata",
    kind: "company",
    name: site.name,
    email: site.email,
  },
  /*
   * TODO(owner): confirm that the mailbox chirag.bansal@sidedataa.com exists before
   * printing, and confirm the phone number format below.
   */
  {
    slug: "chirag-bansal",
    kind: "person",
    name: "Chirag Bansal",
    title: "CEO",
    email: "chirag.bansal@sidedataa.com",
    phone: "+1 437 431 3144",
    phoneDial: "+14374313144",
  },
  // Another person (data-only change; then `npm run cards:qr && npm run cards:print`):
  // {
  //   slug: "first-last",
  //   kind: "person",
  //   name: "First Last",
  //   title: "Job title",
  //   email: "first.last@sidedataa.com",
  //   phone: "+1 555 555 5555",
  //   phoneDial: "+15555555555",
  //   linkedin: "https://www.linkedin.com/in/first-last",
  // },
];

export function assertValidCards(list: readonly Card[] = cards): void {
  const seen = new Set<string>();
  for (const c of list) {
    if (!slugPattern.test(c.slug)) {
      throw new Error(`Invalid card slug "${c.slug}": use [a-z0-9-] only.`);
    }
    if (seen.has(c.slug)) throw new Error(`Duplicate card slug "${c.slug}".`);
    seen.add(c.slug);
    if (c.kind === "person" && !c.title) {
      throw new Error(`Person card "${c.slug}" needs a title.`);
    }
    if (c.kind === "company" && c.title) {
      throw new Error(`Company card "${c.slug}" must not have a title.`);
    }
    if (Boolean(c.phone) !== Boolean(c.phoneDial)) {
      throw new Error(`Card "${c.slug}": set phone and phoneDial together.`);
    }
    if (c.phoneDial && !/^\+[0-9]{8,15}$/.test(c.phoneDial)) {
      throw new Error(`Card "${c.slug}": phoneDial must look like +14374313144.`);
    }
  }
  if (!list.some((c) => c.slug === "sidedata" && c.kind === "company")) {
    throw new Error('A company card with slug "sidedata" is required.');
  }
}

assertValidCards();

export function getCard(slug: string): Card | undefined {
  return cards.find((c) => c.slug === slug);
}

/** Path of the digital page: /card for the company, /card/<slug> for people. */
export function cardPath(card: Card): string {
  return card.slug === "sidedata" ? "/card" : `/card/${card.slug}`;
}

/** Absolute, canonical URL used in QR codes and shown on the card. */
export function cardUrl(card: Card): string {
  return `${cardOrigin}${cardPath(card)}`;
}

export function vcardPath(card: Card): string {
  return `/card/${card.slug}/contact.vcf`;
}
