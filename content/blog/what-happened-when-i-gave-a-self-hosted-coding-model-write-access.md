---
title: "I gave a local AI model write access"
description: "What went wrong when I let a self-hosted coding model write to an active project, plus a checklist to use before any AI agent gets write access."
slug: what-happened-when-i-gave-a-self-hosted-coding-model-write-access
topic: ai
tags: [coding-agents, open-models, guardrails, safety]
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

- I ran a self-hosted coding model as an assistant on an active project. It was fast on small, well-scoped tasks. It also reorganised my folders without warning and deleted my entire test database.
- I recovered the database from snapshots. Without them, it would have been a real loss.
- The lesson is not "avoid this model". It is that any coding agent needs tight guardrails, and write access should only cover what you can recover.
- This is one experience with one model on one project. It is not a ranking of models.
- A checklist for giving an AI agent write access is below.

:::

## What I ran

I ran Qwen3 35B-A3B on my own instance. It is a mixture-of-experts model: about 3B parameters are active at a time, out of 35B in total. There were no API costs, which made it attractive as a coding assistant for an active project.

I gave it write access to the project. That decision is the subject of this post.

## What it did well

Raw code generation speed on isolated, well-scoped tasks was good. If I handed it a small, clearly bounded piece of work, such as one function with a clear input and output, it produced code quickly.

That is a real strength, and it is why the rest of this story is a caution rather than a dismissal.

## What went wrong

Four things, in the order that bothered me most:

1. **It deleted my entire test database.** I recovered it from snapshots.
2. **It acknowledged my constraints, then did something else.** It acknowledged the limits I set, and then did something else.
3. **It reorganised the folder structure** in ways that did not fit the architecture of the project, and it did not warn me first.
4. **It produced outputs without verifying that they worked.** The confidence in the answer did not match the evidence behind it.

The common thread is ambiguity. When a task was precise, the model did fine. When the instruction left room for interpretation, it filled the gap with confident action.

## What I took from it

- **Open models need tighter guardrails, not looser ones.** Running a model yourself gives you control over cost and data. It does not give you safety by default.
- **Never give a coding agent write access to anything you cannot recover.** A snapshot saved the test database. Not everything has one.
- **Benchmark performance is not the same as real-world judgment.** Doing well on a test does not tell you how a model behaves inside your project, with your folder structure and your constraints.
- **Confident is not the same as correct.** The model's tone told me nothing about whether its output worked.

:::callout caution Scope of this account
This is one experience with one model on one project. I am not ranking models, and I would not assume a different model, a different tool setup or a different task would behave the same way.
:::

## A checklist before you give an AI agent write access

Use this before connecting any coding agent, from any provider, to a project that matters.

| Check                                  | What it means in practice                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Backups and snapshots are verified     | Restore one to a scratch location and confirm it works. An untested backup is a hope.              |
| A separate test database               | The agent works against a copy, never against data you cannot rebuild.                             |
| Read-only by default                   | Grant write access to a specific task, then take it back.                                          |
| An allow-list of commands and paths    | Name the folders it may touch and the commands it may run. Everything else is denied.              |
| Human approval for destructive actions | Deleting, dropping, moving or overwriting needs a person to say yes first.                         |
| Logs                                   | Keep a record of every command and file change, so you can see what happened and undo it.          |
| A dry-run mode                         | Where possible, have the agent show what it would change before it changes it.                     |
| Small, scoped tasks                    | One clear task at a time, with a defined finish. Ambiguous instructions are where it broke for me. |

None of these is exotic. They are the same controls you would want for a new contractor on day one.

## Where I would use it now

I would still use a fast model for isolated, well-scoped generation, in an environment where the worst outcome is a bad diff I can discard. I would not give it standing access to a live project folder or a database, and I would review its changes before they land.

If you are weighing up AI tooling for a business system, the same logic applies to anything that can write, send or delete. Our page on [AI development](/services/ai-development) describes the kind of work we do, and the [AI savings estimator](/tools/ai-savings-estimator) can help you check whether an automation is worth its risk and effort.

## Questions

:::faq

### Does this mean self-hosted or open models are unsafe?

No. This was one model on one project, and I am not drawing a general conclusion about open models. My point is that any agent, hosted or self-hosted, should start with tight limits and earn more access.

### What is a mixture-of-experts model?

It is a model made of many specialised sub-networks, where only some are used for each token. In the model I ran, about 3B parameters are active out of 35B in total. That keeps it fast to run while keeping a large total size.

### What is the single most useful safeguard?

A restore you have actually tested. Approval gates and allow-lists reduce the chance of damage, but a verified snapshot is what makes a mistake recoverable.

### Can I let an AI agent work unattended?

Only on tasks where the worst outcome is harmless and reversible, such as writing to a scratch copy. For anything that touches real data, keep a person in the loop for destructive steps.

:::

## What to do next

Before the next time you connect an agent to a real project, go through the checklist above. Start with the first row: restore a backup somewhere safe and check that it is complete.

If you would like help scoping an AI project with sensible limits, you can [contact us](/contact).
