---
title: "One AI agent or six? A cost study"
description: "What a personal job-application pipeline taught me about AI cost: one agent doing six jobs versus six agents with one job each. My own informal figures."
slug: one-ai-agent-or-six-what-a-job-application-pipeline-taught-me-about-cost
topic: ai
tags: [ai-agents, costs, case-study, automation]
author: chirag-bansal
datePublished: 2026-11-01
dateModified: 2026-11-01
draft: true
sources:
  - title: Chirag Bansal on LinkedIn
    url: https://www.linkedin.com/in/chiragb254/
  - title: Chirag Bansal on GitHub
    url: https://github.com/ChiragB254
---

<!-- DRAFT for owner review. Check every claim, number and example against your own records before publishing. -->

:::takeaways

- On one personal project, splitting a single AI agent into six agents with one job each cut my cost from roughly $15 to $75 per application to about $0.27.
- The expensive part was not the model. It was one model switching between six different jobs, with a bloated prompt and no record of what it had already done.
- Two of the six steps need no language model at all. Plain code is cheaper, faster and easier to debug.
- These are my own informal figures from one project. Your numbers will differ, and this does not prove anything general.
- If a vendor proposes an AI workflow, ask how cost is bounded, which model runs each step, and what happens when one step fails.

:::

## The project

ApplyPilot is a personal project I built to handle job applications. It scrapes job listings, scores each one against a job description, evaluates my resume against the role, lightly tailors the resume, fills in the application form with a browser, and logs the result.

That is six different jobs. My first version gave all six to one agent.

All figures in this post are from my own logs, measured informally on one personal project. Your numbers will differ.

## Version 1: one agent, one prompt

Version 1 was a single agent with one large prompt, running on a frontier model. It was the obvious first design: describe the whole task, give the model tools, let it work.

It did not go well. On one Workday-style application form, the agent used over 1,000,000 tokens and never submitted. Across applications I saw roughly $15 to $75 each, with about a 30% success rate.

The cause was not a bad model. One model was context-switching between scraping, scoring, resume analysis, writing, form filling and logging. The prompt grew to cover all of it, and nothing tracked state, so the agent had no reliable memory of what it had already tried.

## The screenshot loop

The worst failure is a good example of how cost hides in loops.

The agent used screenshots to see the page. One 1080p screenshot costs on the order of 1,800 visual tokens (my figure). On dynamic dropdowns, the agent had no memory of the previous attempt, so it took a screenshot, acted, took another, and repeated. In one run it re-screenshotted more than 200 times.

I fixed this in four ways:

- Extract form fields from the HTML instead of from images.
- Answer static questions, the ones whose answer never changes, from a config file with no model call.
- Use a small model only for role-specific answers.
- Set retry limits so a loop ends.

## Version 2: six agents, one job each

I rebuilt it so each step does one thing and uses the cheapest tool that can do it.

| Agent            | Job                                                                                                                  | Model                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| JobScraper       | Collects job listings                                                                                                | None, plain scraping                       |
| JDMatcher        | Scores each job 0 to 100 for fit; 50 jobs scored in parallel                                                         | Cheaper model                              |
| ResumeEvaluator  | Gap analysis of resume against the job                                                                               | Strongest model                            |
| ResumeTailor     | At most 3 keyword insertions; no rewrites, no new bullets                                                            | Strongest model                            |
| ApplicationAgent | Fills the form with Playwright; reads the DOM, uses screenshots only as a last resort, skips gracefully on a CAPTCHA | Small model for role-specific answers only |
| Tracker          | Logs to a database and a spreadsheet                                                                                 | None                                       |

Two decisions mattered most. The steps that need judgment (evaluating and tailoring the resume) get the strongest model, and the high-volume step (scoring 50 jobs) gets a cheaper one. And the tailoring step is tightly boxed: three keyword insertions, nothing else, so it cannot wander.

## The numbers

| Measure              | Single agent (v1)                                 | Six agents (v2)                                    |
| -------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Tokens               | Over 1,000,000 on one form, which never submitted | About 290k to 325k for 15 applications             |
| Cost per application | Roughly $15 to $75                                | About $0.27                                        |
| Success rate         | About 30%                                         | About 85%                                          |
| When one step fails  | A failure could take the pipeline down            | The failed agent no longer takes the pipeline down |

Treat this table carefully. These are my own informal figures from one personal project, not a benchmark. The two versions also differ in more than agent count: I fixed the screenshot loop and moved static answers to a config file at the same time. So I would not credit the saving to any single change.

## What I took from it

- **Use the right model for the right task.** A cheaper model is fine for scoring. The strongest model is worth paying for where judgment matters.
- **Run independent work in parallel.** Scoring 50 jobs does not need to wait on anything.
- **Isolate failures.** When ApplicationAgent hits a CAPTCHA, it skips and the rest carries on.
- **Make it debuggable.** With one job per agent, a bad output points to one place.
- **Treat token cost as a design constraint.** An agent that can loop can spend without limit, so the budget belongs in the design, not in the bill.

## What a business owner can take from this

You will probably never build a job-application pipeline. The pattern still applies when someone proposes an AI workflow for your business. Three questions are worth asking:

1. **How are costs bounded?** Ask what stops a run from looping. Retry limits, token caps and a maximum number of steps per task should be part of the design.
2. **Which model runs each step?** If the answer is "the same large model for everything", ask why. Some steps may need no model at all.
3. **What happens when one step fails?** You want a failed step to be skipped or retried and logged, not to stop the whole process or fail silently.

The [AI savings estimator](/tools/ai-savings-estimator) can help you put rough numbers on a workflow before anyone builds it. If you want to talk through a specific case, see our [AI development service](/services/ai-development).

## Questions

:::faq

### Is it always cheaper to use several small agents instead of one?

No. In my project it helped because the work split into clearly different jobs, and several of them did not need a language model. A task with one coherent job may be fine with a single agent.

### Why not just use the strongest model for every step?

It costs more and often adds nothing. In my pipeline the scoring step runs on a cheaper model, and two steps use no model at all, while the strongest model is kept for resume evaluation and tailoring.

### Can I rely on your cost figures for my own project?

No. They come from my own logs, measured informally on one personal project. Model prices, task difficulty and design choices all change the result.

### What is the simplest way to stop a runaway agent loop?

Set a hard retry limit and a cap on steps for each task, and give the agent a record of what it has already tried. In my case, the loop came from an agent with no memory of its last attempt.

:::

## What to do next

If you are looking at an AI workflow, write down the separate jobs inside it. For each one, ask whether it needs a model, and if so how capable a model. Then ask what happens when that job fails.

Put rough numbers on volume and time with the [AI savings estimator](/tools/ai-savings-estimator). If you would like a second opinion on a plan, you can [contact us](/contact).
