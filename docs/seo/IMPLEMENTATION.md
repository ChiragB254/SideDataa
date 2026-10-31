# SEO and blog implementation

How the technical SEO foundation works and how to add content. The research behind it is in `research-brief.md`; follow its "Do not" list.

## Where things live

| Concern                                                                                | File                                                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Site-wide metadata, `pageMetadata()`, verification tokens                              | `lib/seo.ts`                                                                 |
| JSON-LD builders (Organization, WebSite, BreadcrumbList, Service, BlogPosting, Person, ProfilePage, FAQPage, WebApplication) | `lib/jsonld.ts`                                                              |
| Authors (bio, links, credential)                                                       | `lib/authors.ts`                                                             |
| Blog topics and their intros                                                           | `content/blog-topics.ts`                                                     |
| Blog loading, drafts, pagination                                                       | `lib/blog.ts`                                                                |
| Markdown rendering                                                                     | `lib/markdown.ts` (`marked`, server only, no client JS)                      |
| Sitemap, robots, feed                                                                  | `lib/sitemap-entries.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/feed.xml/` |
| Service FAQ and "what we need from you"                                                | `content/service-guides.ts`                                                  |
| Editorial policy text                                                                  | `content/editorial.ts`                                                       |

Every page builds its metadata with `pageMetadata({ title, description, path, ... })`. A child's `openGraph` replaces the parent's whole object in Next.js, so the helper builds the complete object every time. Keep titles at 36 characters or fewer (the brand is appended, 60 total) and descriptions at 155 or fewer.

## Add a post

1. Create `content/blog/<slug>.md`. The file name must equal the `slug`.
2. Add frontmatter, then the body in Markdown.
3. Set `draft: false` when it is ready. Run `npm run build && npm run seo:check`.

```md
---
title: "How much does a RAG chatbot cost to build?"
description: "One or two sentences, 50 to 160 characters."
slug: rag-chatbot-cost
topic: ai # a slug from content/blog-topics.ts
tags: [rag, costs]
author: chirag-bansal # a slug from lib/authors.ts
datePublished: 2026-11-02 # YYYY-MM-DD, or an ISO date-time with offset
dateModified: 2026-11-02 # change only when the content really changes
draft: true
reviewedBy: Name # optional, a real person who reviewed it
sources: # optional, shown as a "Sources" list
  - title: Source name
    url: https://example.com/page
---
```

Body features (all server-rendered, no client JavaScript):

- `##` and `###` headings get stable ids. Posts with three or more `##` headings get a table of contents. Do not use `#` (the title is the h1).
- `:::takeaways` ... `:::` is the answer-first "Key takeaways" block. Put it first.
- `:::callout note|caution Optional title` ... `:::`
- `:::faq` with `### Question` followed by the answer, repeated, then `:::`. It renders visibly and feeds FAQPage JSON-LD.
- Fenced code blocks and tables scroll inside a focusable region.
- Raw HTML is escaped. Images are not supported yet (they need explicit width and height; add support in `lib/markdown.ts` when the first one is needed).

Related posts (same topic, newest first), the link up to the topic page (when it exists) and the link to the topic's service page are added automatically.

## Draft and publishing rules

- `draft: true` posts are excluded by `getPublishedPosts()`, which is the only list the index, topic pages, author page, sitemap, feed, nav and `generateStaticParams` use. A draft slug is not generated, so it returns 404 in production (`dynamicParams = false`). In `next dev` only, drafts can be previewed; they are noindex.
- The production site starts with zero published posts. While there are none: `/blog` shows "Articles are coming", is `noindex`, is not in the sitemap, the "Blog" nav item and the RSS discovery link are not rendered, and `/feed.xml` is an empty valid channel.
- A topic page (`/blog/topic/<slug>`) exists only when the topic has at least two published posts (`MIN_POSTS_FOR_HUB`).
- `/blog/page/<n>` exists only when there are more than 10 published posts.
- Test posts live in `tests/fixtures/blog` and load only when `BLOG_FIXTURES=1`. Never set it for a real build; `npm run seo:check` fails if fixture posts appear in a build without that variable.

## Structured data

| Page                                 | Types                                         |
| ------------------------------------ | --------------------------------------------- |
| `/`                                  | Organization, WebSite                         |
| `/services/<slug>`                   | Service, BreadcrumbList, FAQPage              |
| `/tools`                             | BreadcrumbList                                |
| `/tools/ai-savings-estimator`        | WebApplication, BreadcrumbList, FAQPage       |
| `/authors/<slug>`                    | ProfilePage (with Person), BreadcrumbList     |
| `/about/editorial-policy`            | BreadcrumbList                                |
| `/blog`, `/blog/page/<n>`, topics    | BreadcrumbList                                |
| `/blog/<slug>`                       | BlogPosting, BreadcrumbList, FAQPage (if any) |

The `Breadcrumb` component renders the visible trail and its BreadcrumbList from the same items. The `Faq` component renders the visible Q&A and its FAQPage from the same items. JSON-LD must always match visible content. Organization has no `sameAs`, ratings, reviews or founding date until those are real. Google's Rich Results Test cannot be run offline: after deploy, test a service page, the author page and a post, and run the Schema Markup Validator.

## Checks

```bash
npm run build
npm run seo:check      # reads .next/server/app; no browser
```

It fails with a table if any indexable page lacks one `<title>` (65 characters or fewer), a 50 to 160 character description, a self-referencing absolute canonical, one `<h1>`, Open Graph and twitter tags or `lang`; if JSON-LD is invalid, or FAQPage, Article headline or BreadcrumbList disagree with the visible page; if a sitemap URL is missing from the build or is noindex; if an indexable page is missing from the sitemap; if an internal link does not resolve; if an image has no `alt`; if titles or descriptions are duplicated; if `robots.txt` lacks the sitemap line or blocks an allowed bot; or if the feed is not valid RSS 2.0. Checker logic is unit-tested in `tests/unit/seo-check.test.ts` with small HTML fixtures. `npm run test:e2e` runs the normal build (zero posts) and then a fixture build (`playwright.fixtures.config.ts`).

## TODO(owner)

- Verify the site in Google Search Console and Bing Webmaster Tools. Set `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` in the build environment (the deploy workflow would need to pass them), or paste the tokens into `verificationTokens` in `lib/seo.ts`. Submit `https://sidedataa.com/sitemap.xml`.
- When a company LinkedIn page, Google Business Profile or directory profile (Clutch, GoodFirms) exists, add `sameAs` to `organization()` in `lib/jsonld.ts`. Use identical name and description everywhere.
- Pricing: nothing is published. Decide the approach, then add a "How does pricing work?" FAQ to `content/service-guides.ts`.
- Analytics: none is installed. Decide before adding any (the privacy notice must match).
- Review `content/editorial.ts` (the policy is a set of commitments) and update the reviewed date when you re-read it.
- Optionally add a public verification URL for the Google Cloud certification (`lib/authors.ts`).
- Publish the first post to switch the blog on. The research brief suggests about ten strong posts, then two to four a month, each human-edited and fact-checked.
- Training crawlers (GPTBot, ClaudeBot, Google-Extended) are allowed in `app/robots.ts`; blocking them does not affect search inclusion. The file comment gives the change.
- The site language tag is `en-CA` (unchanged).
