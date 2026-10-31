---
title: "Fixture post: RAG evaluation"
description: "TEST FIXTURE, not a real article. Used by automated tests to exercise the blog engine: headings, table of contents, code, tables, callouts and FAQ."
slug: fixture-rag-evaluation
topic: ai
tags: [fixture, testing]
author: chirag-bansal
datePublished: 2026-10-20
dateModified: 2026-10-25
draft: false
reviewedBy: Test Reviewer
sources:
  - title: Example source one
    url: https://example.com/source-one
  - title: Example source two
    url: https://example.com/source-two
---

:::takeaways

- This is placeholder text for tests. It makes no claims about real systems.
- The engine renders this block first, before the first heading.
- A table of contents appears because there are three or more sections.

:::

## First section

This paragraph exists only to test rendering. It contains a [link to the services page](/services) and some `inline code` that should wrap rather than overflow on a narrow screen.

:::callout note Example note
This is a note callout used in automated tests.
:::

## Code and tables

A code block must scroll inside its own focusable region:

```ts
export function veryLongFunctionNameForTestingHorizontalOverflowBehaviour(
  argumentOne: string,
  argumentTwo: string,
): string {
  return `${argumentOne}-${argumentTwo}-this-line-is-intentionally-long-so-that-it-overflows-on-a-phone`;
}
```

| Column one | Column two | Column three |
| ---------- | ---------- | ------------ |
| alpha      | beta       | gamma        |
| delta      | epsilon    | zeta         |

:::callout caution Example caution
This is a caution callout used in automated tests.
:::

## Questions

:::faq

### What is this page for?

It is a test fixture. It is never published on the real site.

### Does it use real data?

No. Every statement here is placeholder text.

:::
