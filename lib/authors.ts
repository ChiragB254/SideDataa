/**
 * Author registry: the single source of truth for bylines, the author page and
 * Person JSON-LD. Add a person here only with their approval of every field.
 */
export type Author = {
  slug: string;
  name: string;
  jobTitle: string;
  /** Approved bio. Use as written; do not embellish. */
  bio: string;
  /** Certification shown on the author page and in Person JSON-LD (hasCredential). */
  credential: { name: string; issuer: string };
  place: string;
  linkedin: string;
  github: string;
  /** Path of the digital card, if the person has one. */
  cardPath?: string;
};

export const authors: Record<string, Author> = {
  "chirag-bansal": {
    slug: "chirag-bansal",
    name: "Chirag Bansal",
    jobTitle: "CEO",
    bio: "Chirag Bansal is the CEO of SideData Technologies, an AI engineer based in Toronto. He is Google Cloud Certified: Generative AI Leader and active in the AWS and AI community.",
    // TODO(owner): add the certification's public verification URL or credential ID
    // to Person JSON-LD (credential.url) if you want it shown.
    credential: {
      name: "Google Cloud Certified: Generative AI Leader",
      issuer: "Google Cloud",
    },
    place: "Toronto, Ontario",
    linkedin: "https://www.linkedin.com/in/chiragb254/",
    github: "https://github.com/ChiragB254",
    cardPath: "/card/chirag-bansal",
  },
};

export function getAuthor(slug: string): Author | undefined {
  return authors[slug];
}

export function authorPath(author: Pick<Author, "slug">): string {
  return `/authors/${author.slug}`;
}

export function requireAuthor(slug: string): Author {
  const a = authors[slug];
  if (!a) throw new Error(`Author "${slug}" is missing from lib/authors.ts`);
  return a;
}
