# Draft posts: owner review checklist

Four posts in `content/blog/` are written as drafts (`draft: true`, no `reviewedBy`). None is published. The editorial policy promises that a named person reviews each article before it goes live, so you need to read, edit and confirm each one before publishing.

Each file starts with an HTML comment (`<!-- DRAFT for owner review ... -->`). The blog renderer escapes raw HTML, so that comment would show as visible text. Delete it before publishing.

Figures in posts 1 and 2 come from your own public posts. Confirm each against your own records. Post 3 uses made-up round numbers on purpose. Post 4 makes no numeric claims.

## Common to all four

- Titles are 33 to 36 characters. The site adds " | SideData Technologies", so the full title tag stays at 60 or fewer.
- Descriptions are 144 to 155 characters.
- Dates are `2026-11-01` placeholders. Set them to the real publish date.
- `topic: ai`, `author: chirag-bansal`. The AI topic page appears only after two posts are published.
- Internal links used: `/services/ai-development`, `/tools/ai-savings-estimator`, `/contact`. All exist in the build.
- Images are not supported by the renderer yet. Diagrams below would need support added in `lib/markdown.ts`.

## Post 1: one-ai-agent-or-six-what-a-job-application-pipeline-taught-me-about-cost

First person. Confirm these statements:

- ApplyPilot does: scrape listings, score against a job description, evaluate and lightly tailor a resume, fill forms with a browser, log results.
- v1 was one agent, one prompt, on a frontier model.
- On one Workday-style form, v1 used over 1,000,000 tokens and never submitted.
- v1 cost roughly $15 to $75 per application, with about a 30% success rate.
- Cause: one model context-switching across six jobs, a bloated prompt, no state tracking.
- v2 agents and models: JobScraper (no LLM), JDMatcher (cheaper model, 50 jobs in parallel, 0 to 100 score), ResumeEvaluator (strongest model, gap analysis), ResumeTailor (strongest model, max 3 keyword insertions, no rewrites, no new bullets), ApplicationAgent (Playwright, DOM first, screenshots last resort, skips on CAPTCHA), Tracker (database and spreadsheet, no LLM).
- v2 results: about $0.27 per application, about 290k to 325k tokens for 15 applications, about 85% success.
- One 1080p screenshot is on the order of 1,800 visual tokens, and the loop re-screenshotted 200+ times on dynamic dropdowns.
- Fixes: fields from HTML, static answers from a config file with no model call, a small model only for role-specific answers, retry limits.

Wording I inferred from your facts. Check or cut:

- The table says v1 "a failure could take the pipeline down". Your facts say v2's failed agent "no longer" takes it down. Confirm v1 behaved that way.
- The ApplicationAgent row says "small model for role-specific answers only". Confirm that this is how the final version works.
- "So I would not credit the saving to any single change" assumes v2 changed several things at once (agent split, HTML extraction, config answers, retry limits). Confirm.
- Whether the success rate (30%, 85%) is per application attempted. State the definition if you know it.

Consider adding: an architecture diagram of the six agents, a screenshot of the tracker, a link to the repository or your original LinkedIn post (add to `sources` only with the real URL).

## Post 2: what-happened-when-i-gave-a-self-hosted-coding-model-write-access

First person. Confirm these statements:

- Model: Qwen3 35B-A3B, mixture-of-experts, about 3B active out of 35B parameters.
- Run locally on your own instance, no API costs, as a coding assistant on an active project.
- It reorganised the folder structure in ways that did not fit the architecture, without warning.
- It produced outputs without verifying that they worked.
- It acknowledged your constraints, then did something else.
- It deleted your entire test database; you recovered it from snapshots.
- Strength: raw code generation speed on isolated, well-scoped tasks.
- The "Where I would use it now" section states how you would use it today. That is my reading of your stated lessons, not a fact you gave me. Rewrite it to match your actual practice.
- The FAQ gives a one-sentence definition of mixture-of-experts. Confirm you are happy with it.

Consider adding: the agent or tool you ran the model through (not named in the draft because it was not given), what "write access" meant exactly (files, shell, database), and how long the recovery took. Name the tool only if you want to.

## Post 3: how-to-estimate-whether-an-ai-project-will-pay-back

No personal claims, no sources. The example numbers are fictional and labelled "illustrative numbers, not typical figures". Recheck the arithmetic before publishing:

- Today: 400 x 12 min = 4,800 min = 80 h; x $30 = $2,400 per month.
- Buckets: 200 x 1 + 160 x 5 + 40 x 12 = 200 + 800 + 480 = 1,480 min = 24.67 h.
- Saved: 80 - 24.67 = 55.33 h; x $30 = $1,660. Less $250 run cost = $1,410 per month.
- Payback at full use: 18,000 / 1,410 = 12.77 months.
- Ramp (25%, 50%, 75%, then 100%): 165 + 580 + 995 = 1,740 over three months. (18,000 - 1,740) / 1,410 = 11.53, so about 14.5 months in total.
- Cautious (30/50/20): 120 x 1 + 200 x 5 + 80 x 12 = 2,080 min = 34.67 h; saved 45.33 h = $1,360; net $1,110; payback 16.2 months.
- Optimistic (65/30/5): 260 x 1 + 120 x 5 + 20 x 12 = 1,100 min = 18.33 h; saved 61.67 h = $1,850; net $1,600; payback 11.25 months.
- "About a third of one full-time role" assumes 160 working hours per month (55.3 / 160 = 0.35).

Check that the post's description of the estimator ("walks through this same logic with editable assumptions") matches what `/tools/ai-savings-estimator` does. I did not read the tool's code in this task.

Consider adding: a screenshot of the estimator with the example inputs (after you confirm it produces similar output).

## Post 4: rag-or-fine-tuning-how-to-choose-for-a-small-business-project

Neutral voice, no first person, no client claims, no numbers. Confirm these statements:

- The definitions of prompting, RAG and fine-tuning match how you would explain them.
- The decision table, especially the latency row, which is hedged and says to test.
- The closing sentence about the Qdrant, query fusion and re-ranking prototypes in `q1-finance-rag` and `Q1-Report-Assistant`, built on public financial reports. Confirm the repository names and that the repos are public.
- The "keep sensitive data in mind" callout is general guidance, not legal advice.

Consider adding: a diagram of the RAG flow (query, retrieve, generate) and, if you have one, a sample evaluation sheet as a downloadable file.

## Suggested internal links once other pages exist

- Post 1 and 2 to each other, once both are published (the site adds related posts in the same topic automatically).
- Post 3 to post 4 and the reverse, as a "choosing and costing an AI project" pair.
- Any of them to `/tools/ai-readiness-checker` only after that page exists.

## Publish steps for each post

1. Read the whole post and edit it in your own words. Delete the HTML comment at the top.
2. Confirm every item listed above. Remove any sentence you cannot support.
3. In the frontmatter, set `draft: false`.
4. Set `datePublished` and `dateModified` to the real publish date.
5. Add `reviewedBy: Chirag Bansal` (a real person who has reviewed it).
6. Check the `sources` list. Add only real URLs.
7. Run `npm run build && npm run seo:check`.
8. Publish at most one or two posts at first. The blog turns on when the first post is published, and a topic page appears when a topic has two published posts.
