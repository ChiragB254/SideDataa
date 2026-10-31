# SEO and AI-visibility research brief

Prepared 2026-10-31 for SideData Technologies (sidedataa.com). This is a planning document, not legal advice. Search volumes, rankings and AI answers were **not** measured; see "What is unknown".

Labels: **FACT** = documented by Google, a vendor or a regulator. **PRACTICE** = evidence-backed practice (studies, observed patterns). **SPEC** = inference. Confidence: H / M / L.

## Bottom line

- Google, OpenAI, Anthropic and Perplexity publish no special "AI optimisation" path. Google says AI Overviews and AI Mode need no extra requirements beyond normal Search eligibility. The vendors only document crawler access.
- What works: a small number of original, expert pages; a clean crawlable site; one consistent company identity everywhere; real third-party mentions and reviews.
- The biggest risk to a new site is mass-produced content. Scaled AI posts and templated city pages fall under Google's scaled-content and doorway-page spam policies.
- Expect slow results. Ahrefs (May 2025): about 1.7% of newly found pages reach the Google top 10 within a year. First enquiries are more likely from long-tail pages, Google Business Profile, directory listings, referrals and free tools than from head terms.

## 1. Google on AI content and quality (FACT, H)

- No ban on AI content, but "scaled content abuse" covers pages made mainly to manipulate rankings regardless of how they are made. Doorway abuse includes city/region pages that funnel to one destination. (Spam policies, updated 2026-08-28)
- Fact-check AI output, including titles, meta descriptions, structured data and alt text. Disclosing how content was made is encouraged. (Gen-AI guidance, 2026-10-01)
- Use clear bylines linked to real author information; do not invent authors or credentials; do not change dates to look fresh. Mass-producing content on many topics is a warning sign. (Helpful content, 2026-10-05)
- No published "safe volume": value per page is the test (PRACTICE, M).

**For SideData:** about 10 strong launch posts, then 2 to 4 a month, each with a named author, a human edit and a fact-check, and something only SideData can say (real projects, cost drivers, architecture decisions, failures). No page farms for cities where SideData has no presence.

## 2. How AI assistants pick companies

- **Google (FACT, H):** AI features use normal Search indexing and snippet eligibility; no special markup or text file. Google-Extended controls Gemini training/grounding and does not affect Search inclusion.
- **OpenAI (FACT, H):** OAI-SearchBot = ChatGPT search (block it and you can be left out of answers); GPTBot = training; ChatGPT-User = user-initiated fetches. Allow OAI-SearchBot and let its published IPs through your CDN/host.
- **Anthropic (FACT, H):** ClaudeBot = training; Claude-User = user fetches; Claude-SearchBot = search indexing. All honour robots.txt.
- **Perplexity (FACT, H):** PerplexityBot = search index; Perplexity-User = user requests (generally ignores robots.txt).
- **llms.txt (FACT, H/M):** no AI vendor has confirmed reading it; Google staff call it speculative. Optional, low value.
- **Correlational evidence (PRACTICE, M):** Ahrefs (Dec 2025, about 75K brands): YouTube mentions (about 0.74) and branded web mentions (0.66 to 0.71) track AI visibility; backlinks and page count were weak. Correlation, skewed to big brands.
- **Unknown:** how any assistant weighs Clutch, GoodFirms, Reddit, LinkedIn or Wikidata. Directories and "top X" lists dominate commercial results, so they are likely retrieval sources (SPEC, M/L). Wikipedia is unrealistic without significant independent coverage.

**For SideData:** allow Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot. Training bots are a business choice (blocking does not affect search inclusion). Confirm the host/CDN does not block these bots. Use exactly one name, description and address everywhere (site, Google Business Profile, Bing Places, LinkedIn, Clutch, GoodFirms).

## 3. Technical checklist (Next.js 16 App Router)

- `metadataBase`, `title.template`, absolute self-referencing `alternates.canonical` on every page. A child `openGraph` replaces the parent's whole object: share fields via a constant.
- `app/sitemap.ts` and `app/robots.ts`. Google ignores `changefreq`/`priority`; `lastmod` only if accurate (never `new Date()` at build).
- JSON-LD in a native `<script type="application/ld+json">`, escape `<` as `<`. Validate with the Rich Results Test and validator.schema.org.
- Schema: Organization (home/About); Service (each service page); Article/BlogPosting with Person author; Person + ProfilePage for authors; BreadcrumbList; WebApplication for tools. **FAQPage:** Google stopped showing FAQ rich results on 2026-05-07; markup is harmless, keep visible FAQs for users and AI. No self-serving review/star markup on your own company pages. LocalBusiness only if the address is real and visible.
- hreflang only if real localised Canada/India versions exist (en-CA/en-IN, self-referencing, x-default). Otherwise a single English site.
- Core Web Vitals: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 (p75).
- URLs: `/services/...`, `/blog/<slug>`, `/tools/<tool>`, `/case-studies/<slug>`; lowercase, stable, permanent redirects on change. Pillar pages per service, blog posts link up and across, no orphan pages. Crawlable pagination links, self canonical per page. RSS feed.
- Validators: Rich Results Test, Schema Markup Validator, Search Console, Bing Webmaster Tools, PageSpeed Insights, Lighthouse.

## 4. Local and B2B services SEO

- **Google Business Profile (FACT, H):** needs a location customers can visit, or travel to customers (then hide the address; service area generally within about 2 hours' drive). No P.O. boxes, virtual offices or remote mailboxes. Business name = real-world name only; no keywords.
- **Reviews (FACT, H):** no incentives, no review gating, no staff/contractor/family reviews, no unusual spikes. Asking all genuine clients is fine.
- **Directories:** Clutch, GoodFirms, DesignRush, Crunchbase, Bing Places, LinkedIn Company. Value: referral traffic, being a retrieval source for "top X" queries, proof the company exists. Paid placements exist but are not needed for the profile to work (SPEC, M).
- **Earned links (PRACTICE, M):** useful free tools, case studies co-published with clients, talks and meetups, open-source work, cloud-partner directories, guest interviews.

## 5. SERP snapshot (observational, 2026-10-31; not localised Google.ca; no volumes)

- Commercial queries ("AI development company Toronto", "cloud consulting Toronto", "AI product development services Canada") are dominated by directories, "top 10" listicles and established agencies.
- "affordable AI development company" is a low-trust space filled with unverifiable claims; compete with transparent pricing logic instead.
- Question/cost queries ("how much does it cost to build a RAG chatbot for a small business") are served by cost-breakdown blog posts: a realistic early target.
- Web development in Toronto is very crowded; some agencies publish price ranges.

**First targets:** specific question and cost pages, comparison/decision pages (for example Azure OpenAI vs AWS Bedrock for Canadian data residency; PIPEDA considerations for LLM apps; RAG vs fine-tuning; how to evaluate a RAG system), tool pages, then case studies. Get listed in the directories that dominate commercial queries.

## 6. Free tools

- Tools earn links when they give a specific useful result without a signup wall. Each tool page needs 800+ words of method, limits, fixes, an example result and an FAQ.
- **Accessibility checker:** automated testing finds only part of problems (about 30 to 57% depending on the study). Never output "WCAG/AODA compliant". Ontario's AODA requires WCAG 2.0 AA for public websites of organisations with 50+ employees (since 2021-01-01). Build on axe-core and say so.
- **AI-readiness checker:** check documented items (robots rules per AI crawler, indexability, canonical, sitemap, structured data, text in HTML, performance). Do not imply guaranteed "AI ranking"; do not weight llms.txt.
- **Estimator:** show every assumption, editable; output low/expected/high ranges, never one "ROI" figure; show the formula; label defaults "example value"; "illustrative, not a quote or guarantee".
- **Privacy/security:** PIPEDA principles apply; CASL needs consent for marketing email (no pre-ticked boxes); do not store scanned URLs or inputs longer than needed; disclose any logging; rate-limit and validate URLs to prevent SSRF.

## 7. Timeline and measurement

- No one can guarantee a ranking (Google). New domain, my estimate (SPEC, M): meaningful non-brand long-tail impressions in 3 to 6 months; first organic enquiries in 6 to 12+ months, sooner via Business Profile, directories and referrals.
- Track: Search Console (indexed pages, non-brand impressions/queries, long-tail positions), Bing Webmaster Tools AI Performance, AI referrers in analytics (chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com), branded search growth, Business Profile calls and clicks, a "how did you hear about us" field including AI assistants.
- **Monthly AI-mention test:** 20 to 30 fixed prompts (buyer-style and brand-style) run in ChatGPT (search on), Claude (web search on), Perplexity, Gemini, Google AI Mode and Copilot; fresh sessions, Toronto location, each prompt 3 times; record mention yes/no, position, competitors, cited URLs and factual errors; fix errors at the source.

## 8. Claims and compliance (Canada; not legal advice)

- The Competition Act prohibits materially false or misleading representations, judged by general impression; literally true claims can mislead by omission. Performance claims need adequate and proper testing. Testimonials must be genuine and authorised. Penalties are large.
- Avoid "cheapest", "#1", "best in Canada", "guaranteed results", "X% ROI". Use verifiable specifics: price ranges with scope, named stack, real case-study metrics with client permission.
- Testimonials only with written consent, verbatim and dated. No staff reviews; no bought or swapped reviews. Have a Canadian lawyer review pricing and claims pages once.

## Top 15 actions

1. Verify the site in Google Search Console and Bing Webmaster Tools; submit the sitemap.
2. robots.txt: allow Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot; decide on training bots; confirm no CDN/WAF blocking.
3. Shared SEO module (metadataBase, canonicals, title template, Open Graph, accurate sitemap lastmod, robots).
4. Organization JSON-LD with sameAs links; BreadcrumbList; Article + Person.
5. Google Business Profile only if eligible; Bing Places.
6. Identical name/address/description on LinkedIn, Clutch, GoodFirms, Crunchbase, DesignRush.
7. Ask every client for a review (no incentives, no gating).
8. Make each service page specific: scope, process, stack, how pricing works, timelines, visible FAQ, related case study.
9. Publish real case studies with client permission.
10. Author pages (Person + ProfilePage), bylines, "how we use AI in our content" note.
11. Tools: estimator, AI-readiness checker, accessibility checker, each with method and limits.
12. About 10 long-tail question posts, then 2 to 4 a month, each human-edited and fact-checked.
13. Earn mentions: talks, client co-marketing, cloud partner directories, a YouTube explainer channel, anonymised original data from tools.
14. Measurement setup (AI referrer segments, branded filter, Bing AI Performance, "how did you hear" field, monthly prompt test log).
15. One lawyer review of claims, pricing and the estimator.

## Do not

- Mass-publish AI-generated posts or city pages without real presence.
- Invent authors, headshots, credentials, clients, logos, testimonials or statistics.
- Change dates without real updates; set sitemap lastmod to build time.
- Use a virtual office/mailbox for Business Profile, or keywords in the business name.
- Incentivise or gate reviews; have staff, friends or family review.
- Add self-serving review/star markup; write JSON-LD that does not match visible content.
- Make "cheapest/best/#1/guaranteed ROI" claims or show single-number ROI outputs.
- Let tools say "WCAG/AODA compliant" or "AI-ready guaranteed".
- Buy links, run private blog networks, or buy expired domains.
- Block OAI-SearchBot, PerplexityBot or Claude-SearchBot through CDN bot modes.
- Rely on llms.txt or pay anyone who promises guaranteed AI ranking.
- Add hreflang for India or Canada without real localised pages.

## What is unknown or needs a human check

- How any assistant weighs directories, Reddit, LinkedIn or Wikidata: undocumented.
- OpenAI and Perplexity bot pages are undated: re-check before launch.
- Business Profile eligibility for SideData's real premises.
- Whether SideData has 50+ Ontario employees (AODA would then apply to its own site).
- Search volumes and difficulty: need Google Keyword Planner, Search Console or a paid tool.
- Legal review of claims and the estimator.

## Key sources (accessed 2026-10-31)

Google Search Central: spam policies (https://developers.google.com/search/docs/essentials/spam-policies), generative AI content (https://developers.google.com/search/docs/fundamentals/using-gen-ai-content), helpful content (https://developers.google.com/search/docs/fundamentals/creating-helpful-content), AI features (https://developers.google.com/search/docs/appearance/ai-features), common crawlers (https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), sitemaps (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), localized versions (https://developers.google.com/search/docs/specialty/international/localized-versions), structured data docs for Organization, LocalBusiness, Article and SoftwareApplication.
OpenAI bots (https://developers.openai.com/api/docs/bots) and ChatGPT search help (https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt). Anthropic crawlers (https://support.claude.com/en/articles/8896518). Perplexity bots (https://docs.perplexity.ai/guides/bots).
Next.js: generateMetadata, sitemap and JSON-LD guides (https://nextjs.org/docs). web.dev Core Web Vitals (https://web.dev/articles/vitals).
Google Business Profile guidelines (https://support.google.com/business/answer/3038177) and contributed-content policy (https://support.google.com/contributionpolicy/answer/7400114).
Competition Bureau Canada, misleading representations (https://competition-bureau.canada.ca/en/node/121); Canadian Code of Advertising Standards (https://adstandards.ca/code/the-code-online/); OPC PIPEDA principles (https://www.priv.gc.ca); Ontario AODA website accessibility (https://www.ontario.ca/page/how-make-websites-accessible).
Secondary (medium confidence): Ahrefs studies on AI brand visibility (https://ahrefs.com/blog/ai-brand-visibility-correlations/), time to rank (https://ahrefs.com/blog/how-long-does-it-take-to-rank/) and llms.txt (https://ahrefs.com/blog/llmstxt-study/); Search Engine Roundtable and Search Engine Journal on llms.txt; Deque and UK government notes on automated accessibility coverage.
