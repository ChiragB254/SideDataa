---
title: "RAG or fine-tuning: how to choose"
description: "RAG, fine-tuning or better prompting? A plain guide to choosing for a small business project, with a decision table and a simple way to evaluate RAG."
slug: rag-or-fine-tuning-how-to-choose-for-a-small-business-project
topic: ai
tags: [rag, fine-tuning, prompting, evaluation]
author: chirag-bansal
datePublished: 2026-11-01
dateModified: 2026-11-01
draft: true
sources: []
---

<!-- DRAFT for owner review. Check every claim, number and example against your own records before publishing. -->

:::takeaways

- Try better prompting first. It is the cheapest option and often enough.
- Use retrieval-augmented generation (RAG) when the model needs your documents, those documents change, or answers must point to a source.
- Consider fine-tuning when you need a consistent style, format or behaviour, not when you need the model to know your facts.
- The options can be combined. Many projects use good prompts plus RAG, and nothing more.
- Whichever you choose, test it on a set of real questions before trusting it.

:::

## The three options in plain language

**Better prompting** means giving the model clearer instructions, examples and context in each request. Nothing about the model itself changes.

**RAG (retrieval-augmented generation)** means the system first searches your documents for relevant passages, then passes those passages to the model with the question. The model answers using what was retrieved. Your documents stay outside the model, in a store you can update.

**Fine-tuning** means training an existing model further on examples, so its behaviour changes. It is mainly a way to teach a pattern, such as a tone, a format or a way of classifying, rather than to store a changing body of facts.

A common confusion is thinking fine-tuning is how you "teach the model your documents". For facts that change or must be traceable, retrieval is usually the more direct tool.

## A decision table

| Your situation                                       | Better prompting              | RAG                                           | Fine-tuning                                                |
| ---------------------------------------------------- | ----------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Your data changes often                              | Only if it fits in the prompt | Good fit: update the documents, not the model | Poor fit: you would retrain to refresh facts               |
| Answers need citations or a traceable source         | Weak                          | Good fit: you can show the retrieved passages | Weak: the model cannot point to where it learned something |
| You need a specific style, tone or output format     | Try first                     | Does not help by itself                       | Good fit when prompts alone are not consistent enough      |
| You have a tight latency budget                      | Fastest, with a short prompt  | Adds a retrieval step                         | Can allow shorter prompts, but check against your needs    |
| You have a small team and little time to maintain it | Lowest effort                 | Needs a document pipeline and ongoing upkeep  | Needs training data, evaluation and re-training over time  |

Read this table as a starting point. Specific tools, models and data change the details, so test before committing.

## When better prompting is enough

Many small projects never need more. If the information the model needs is short, stable and can sit in the prompt, put it there. Add a few examples of good answers. Specify the output format.

Reach for something heavier only when you can name what prompting fails at, with real examples of failures.

## When RAG fits

RAG fits when the answer lives in your documents: policies, product manuals, contracts, past tickets. It suits cases where those documents are updated, where users need to see the source, and where an answer of "I could not find this" is better than a guess.

RAG also has real costs. Someone has to prepare and index documents, split them sensibly, keep them current and remove outdated ones. Poor retrieval produces poor answers, however good the model is.

## When fine-tuning fits

Fine-tuning fits when the behaviour is the problem: you need output in a strict format every time, a consistent voice, or a narrow classification done the same way across thousands of items. You need good examples, usually many of them, and a way to check the result.

It is less suited to a small team with few examples or facts that change monthly. If you are unsure, that is a sign to try prompting and RAG first.

## How to evaluate a RAG system

This is general practice, not a fixed standard. The aim is to find out where the system fails and why.

1. **Build a small question set.** Collect real questions your users would ask. For each, write the expected answer and note the source passage that supports it.
2. **Measure retrieval separately from answer quality.** For each question, check whether the right passage was among those retrieved. If retrieval misses, the model cannot answer well, and improving the prompt will not fix it.
3. **Check for unsupported answers.** Look for statements that are not backed by the retrieved text. A fluent answer with no support is the failure that does the most harm.
4. **Review failures by hand.** Read the misses. Group them: wrong passage retrieved, right passage but wrong answer, document missing, question out of scope.
5. **Repeat after each change.** Run the same set when you change document splitting, search settings or the prompt, so you can see whether the change helped.

A set of a few dozen well-chosen questions is enough to start. Add to it whenever a real user finds a failure.

:::callout caution Keep sensitive data in mind
If your documents contain personal or confidential information, decide where they are stored and which services see them before you build. This applies to RAG, fine-tuning and plain prompting alike. This is general guidance, not legal advice.
:::

## Questions

:::faq

### Can I use RAG and fine-tuning together?

Yes. A common pattern is RAG for the facts and a fine-tuned model for tone or format. Most small projects should confirm that prompting and RAG are not enough before adding fine-tuning.

### Does fine-tuning make a model know my documents?

Not reliably. It can shift behaviour and style, but it is a poor way to store facts that change, and it does not give you citations. For document-based answers, retrieval is usually the better route.

### How do I stop a RAG system from making things up?

You reduce it, you do not eliminate it. Instruct the model to answer only from the retrieved passages and to say when it cannot find an answer, then test for unsupported answers on your question set.

### What does a RAG project need from my side?

Access to the source documents, an owner who can say which versions are current, and a set of real questions with known answers. Those inputs matter as much as the technology.

:::

## What to do next

List the questions you want the system to answer and where the answers live today. If they sit in documents that change, start with prompting plus RAG and a small evaluation set. If your problem is format or tone, collect examples before you decide on fine-tuning.

You can read about our [AI development service](/services/ai-development), try the [AI savings estimator](/tools/ai-savings-estimator) to check whether the project is worth building, or [contact us](/contact). For a sense of the approach, the owner of SideData has published RAG prototypes with a vector database (Qdrant), query fusion and re-ranking, built on public financial reports, in the repositories q1-finance-rag and Q1-Report-Assistant at [github.com/ChiragB254](https://github.com/ChiragB254). These are prototypes, not client work.
