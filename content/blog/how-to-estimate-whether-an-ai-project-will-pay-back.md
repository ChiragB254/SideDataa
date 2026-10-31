---
title: "How to estimate AI project payback"
description: "A plain method for estimating whether automating a workflow with AI will pay back: volume, time, review, build and run cost, ramp-up, and a worked example."
slug: how-to-estimate-whether-an-ai-project-will-pay-back
topic: ai
tags: [roi, costs, planning, automation]
author: chirag-bansal
datePublished: 2026-11-01
dateModified: 2026-11-01
draft: true
sources: []
---

<!-- DRAFT for owner review. Check every claim, number and example against your own records before publishing. -->

:::takeaways

- Start with the work as it is today: how many items, how long each takes, and what an hour costs.
- Split the work into what AI handles fully, what it only assists, and what it cannot do. Review time belongs in every bucket.
- Subtract build cost, run cost and a realistic ramp-up before you call it payback.
- Give a range of three scenarios, not one number. Do not use your best case as your base case.
- Hours saved are only cash saved if you actually spend fewer paid hours.

:::

## Start with the work as it is now

Before you estimate anything about AI, measure the workflow you want to change. You need three numbers:

- **Volume:** how many items per month (invoices, support emails, forms, reports).
- **Time per item:** how many minutes one item takes a person today, start to finish.
- **Cost per hour:** what an hour of that person's time costs you, including more than wages if you can.

Multiply them: volume x time per item x cost per hour gives the monthly cost of the workflow today. Every later number is compared against this one, so it needs to be honest. Time a few real items rather than guessing.

## Split the work into three buckets

AI rarely handles everything. Sort items into three groups:

1. **Fully handled.** The AI produces a result a person only spot-checks.
2. **Assisted.** The AI drafts or extracts, and a person reviews and fixes it.
3. **Not handled.** The item goes through the old manual process.

Each bucket has a different time per item. Even fully handled items carry some review time, because someone has to check a sample. The share in each bucket is the most uncertain number in the whole estimate, which is why it should vary between scenarios.

## Add the costs

| Cost  | What to include                                                                      |
| ----- | ------------------------------------------------------------------------------------ |
| Build | Design, development, testing, integration with your systems. A one-off cost.         |
| Run   | Model usage, hosting, and the time someone spends monitoring it each month.          |
| Ramp  | Months when people are still learning the tool and use it for only part of the work. |

Run cost is easy to underestimate. Usage-based pricing scales with volume, and someone must watch quality, so include their time.

## A worked example

:::callout note Illustrative numbers, not typical figures
Every number in this example is made up and rounded to keep the arithmetic easy to follow. They are not benchmarks and do not describe any real business.
:::

Imagine a team that processes 400 documents a month. Each takes 12 minutes by hand. An hour of staff time costs $30.

**Today:** 400 x 12 minutes = 4,800 minutes = 80 hours. 80 hours x $30 = **$2,400 per month**.

Now assume a tool that sorts the work like this:

| Bucket                     | Share | Items | Minutes per item | Total minutes |
| -------------------------- | ----- | ----- | ---------------- | ------------- |
| Fully handled (spot-check) | 50%   | 200   | 1                | 200           |
| Assisted (review and fix)  | 40%   | 160   | 5                | 800           |
| Not handled (manual)       | 10%   | 40    | 12               | 480           |
| Total                      | 100%  | 400   |                  | 1,480         |

1,480 minutes is about 24.7 hours. Hours saved: 80 - 24.7 = about 55.3 hours. At $30 an hour that is **$1,660 per month** at full use.

Assume run cost is $250 per month. Net saving is 1,660 - 250 = **$1,410 per month**. Assume build cost is $18,000.

**Payback at full use:** 18,000 / 1,410 = about 12.8 months.

### Add the ramp

Suppose people use the tool for 25% of the benefit in month 1, 50% in month 2, 75% in month 3, and 100% from month 4. Run cost is paid from the start.

- Month 1: 25% x 1,660 = 415, minus 250 = 165
- Month 2: 50% x 1,660 = 830, minus 250 = 580
- Month 3: 75% x 1,660 = 1,245, minus 250 = 995
- Total over three months: 1,740

Remaining to recover: 18,000 - 1,740 = 16,260. At 1,410 a month that takes 16,260 / 1,410 = about 11.5 more months. Payback lands at about 14.5 months, so during month 15. Compared with 12.8 months at full use, the ramp added nearly two months.

### Run three scenarios

Change only the bucket shares and keep everything else fixed:

| Scenario   | Fully / assisted / not handled | Hours saved per month | Net saving per month | Payback at full use |
| ---------- | ------------------------------ | --------------------- | -------------------- | ------------------- |
| Cautious   | 30% / 50% / 20%                | 45.3                  | $1,110               | about 16.2 months   |
| Expected   | 50% / 40% / 10%                | 55.3                  | $1,410               | about 12.8 months   |
| Optimistic | 65% / 30% / 5%                 | 61.7                  | $1,600               | about 11.3 months   |

Present the expected case as your base case. The optimistic case tells you the upside, not the plan.

## Hours saved are not always cash saved

In the example, 55 hours a month is roughly a third of one full-time role (assuming about 160 working hours a month). If nobody's pay, hiring or overtime changes, that saving is real capacity but not cash. It becomes cash only if you avoid a hire, cut contractor or overtime spend, or move the freed time to work that earns money.

Decide which of those applies before you count the saving. If you cannot name one, treat the benefit as capacity and say so.

## What estimates usually leave out

Your first estimate will probably skip these. List them even if you cannot price them yet:

- Data preparation: cleaning, organising and getting access to the information the AI needs.
- Change management: training, new procedures, and people's time to adjust.
- Security and privacy review before any customer or personal data goes near a model.
- Maintenance when systems, forms or document formats change.
- Provider price changes, since usage-based pricing can move.
- Quality monitoring: someone checking that accuracy has not drifted.

## Common mistakes

- Using the best case as the base case.
- Ignoring review time, so the AI looks instant.
- Counting hours saved as cash when headcount does not change.
- Assuming full adoption from day one.
- Leaving out run cost and monitoring time.
- Estimating once and never comparing against what happens.

## Try your own numbers

The [AI savings estimator](/tools/ai-savings-estimator) walks through this same logic with editable assumptions. Use your own measured volume and time, and look at the range, not a single result.

## Questions

:::faq

### What payback period counts as good?

There is no universal answer. It depends on your cash position, the risk, and what else you could do with the money. A useful test is whether the project still pays back in your cautious scenario.

### How accurate can an estimate be before building anything?

Rough. The share of work the AI can fully handle is the least certain input, and a small test on real examples is the best way to narrow it. Treat the estimate as a range you will refine.

### Should I include the cost of my own time?

Yes. Time spent specifying, testing and reviewing is a real cost, even if it does not appear on an invoice. Put it in the build and ramp costs.

### What if the workflow volume is small?

Then the saving per month is small and the build cost takes longer to recover. Sometimes a simpler fix, such as a template, a spreadsheet formula or a rule in your existing software, pays back faster than AI.

:::

## What to do next

Time ten real items from the workflow and write down the numbers: volume, minutes per item, cost per hour. Then run the three scenarios with your own bucket shares.

If the cautious case still looks worthwhile, the next step is a small test on real examples. You can read about our [AI development work](/services/ai-development) or [contact us](/contact) to talk it through.
