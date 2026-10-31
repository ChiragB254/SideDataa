/**
 * Editorial policy text. Plain statements only: do not add claims we do not follow.
 * TODO(owner): review this policy, and update `reviewedISO` / `reviewedLabel` whenever
 * you re-read it (the date is shown on the page and used as the sitemap lastmod).
 */
export const editorialPolicy = {
  path: "/about/editorial-policy",
  title: "Editorial policy",
  description:
    "How SideData Technologies writes, reviews and corrects its articles and tools: named human authors, fact-checking, AI assistance and corrections.",
  reviewedISO: "2026-10-31",
  reviewedLabel: "31 October 2026",
  principles: [
    {
      title: "A named person writes every article.",
      body: "Each article has a byline with a link to the author's page. We do not publish under invented names or use made-up authors.",
    },
    {
      title: "We edit and fact-check before publishing.",
      body: "A second pass checks claims, numbers, names and code before an article goes live. Where we rely on a source, we list it at the end of the article.",
    },
    {
      title: "AI tools may help with drafting. A person is responsible.",
      body: "We may use AI tools to help draft or edit text. The named author reads, checks and answers for every claim that is published, and AI output is never published unchecked.",
    },
    {
      title: "We do not invent proof.",
      body: "We do not publish made-up clients, testimonials, statistics, awards or results. Examples are labelled as examples.",
    },
    {
      title: "Dates mean something.",
      body: "The published date is when an article first went live. The last-updated date changes only when we change the content in a way that matters, never to make a page look fresh.",
    },
    {
      title: "We fix mistakes in the open.",
      body: "If you find an error, email support@sidedataa.com. When we correct a material error we update the article and its last-updated date.",
    },
  ],
} as const;
