import type { ServiceSlug } from "./services";

/*
 * "What we need from you" and FAQ content for each service page. Every answer restates
 * how the work is described in content/services.ts (process steps, what we do, tools);
 * none states a price, timeline, result, client or guarantee.
 *
 * TODO(owner): add a "How does pricing work?" question to each FAQ once the pricing
 * approach is confirmed (for example "a quote after a short scoping call", fixed-scope
 * packages). Nothing about pricing is published until then.
 */
export type ServiceGuide = {
  needFromYou: string[];
  faq: { q: string; a: string }[];
};

export const serviceGuides: Record<ServiceSlug, ServiceGuide> = {
  "ai-development": {
    needFromYou: [
      "Real examples of the task, and a description of what a good answer looks like.",
      "Access to the documents or data the system should work from.",
      "Someone who can judge whether the results are right, because we evaluate the prototype on your examples.",
    ],
    faq: [
      {
        q: "What kinds of AI systems do you build?",
        a: "Mostly software built around language models: question answering over your own documents (RAG), assistants and drafting features inside an existing tool, and automation of repetitive, rule-heavy work, with a person approving the steps that matter.",
      },
      {
        q: "How do you check that an AI system gives good answers?",
        a: "We write down what a good answer looks like, collect real examples before choosing a model, and keep an evaluation set so a change to a prompt or model can be compared before it ships.",
      },
      {
        q: "Will you tell me if AI is not the right tool?",
        a: "Yes. We use language models where they earn their place and say so plainly when they do not.",
      },
      {
        q: "What do we have at the end of a project?",
        a: "Documentation, the evaluation set and a walkthrough, so your team can keep improving the system.",
      },
    ],
  },
  "web-development": {
    needFromYou: [
      "The pages and words you need, or a clear idea of them, so we can agree structure and content first.",
      "Details of any systems the site must connect to, such as payment, email or a CRM.",
      "Feedback on working pages as we show them early.",
    ],
    faq: [
      {
        q: "Can we edit the content ourselves?",
        a: "For websites that is the aim: content you can edit without a developer. We will tell you what is practical for your site.",
      },
      {
        q: "How do you approach accessibility?",
        a: "Testing includes automated checks, keyboard and screen-reader passes, and testing on real phones. For existing sites we also audit against WCAG 2.2 AA. Automated tools find only part of the problems, which is why we test by hand as well.",
      },
      {
        q: "What do we receive when the project ends?",
        a: "The deployed site, monitoring basics, and documentation on how to run and deploy it, so someone else can maintain it later.",
      },
      {
        q: "Can you work on a site that already exists?",
        a: "Yes. Typical examples are rebuilding an ageing site on a modern stack, and an accessibility and performance review with a written list of fixes.",
      },
    ],
  },
  "server-management": {
    needFromYou: [
      "A list of what is running and who depends on it, or access so we can find out.",
      "Access to the servers and the accounts that manage them.",
      "A contact for decisions, since we send a plain summary of what changed and what needs a decision.",
    ],
    faq: [
      {
        q: "What do you do first when taking over a server?",
        a: "We take an inventory of what is running, where, and who depends on it. Then we fix the urgent risks first, such as backups, access and unsupported software.",
      },
      {
        q: "Do you test backups?",
        a: "Yes. We set up automated and off-site backups and run restore tests to check that the backups work.",
      },
      {
        q: "Which systems do you support?",
        a: "Linux first, and Windows Server where it is already in use.",
      },
      {
        q: "How will we know what you changed?",
        a: "Maintenance follows a regular, announced schedule, and each period comes with a plain summary of what changed and what needs a decision.",
      },
    ],
  },
  "cloud-services": {
    needFromYou: [
      "What the workload does, what it depends on, any data-location requirements and your budget.",
      "Access to the existing environment, if you are moving from servers or another provider.",
      "Sign-off on the written design before we build or migrate.",
    ],
    faq: [
      {
        q: "Which cloud providers do you work with?",
        a: "AWS, Google Cloud and Microsoft Azure. We will tell you when a simpler option is enough.",
      },
      {
        q: "How do you run a migration?",
        a: "In stages, with a written design first. We test each stage and agree a cut-over plan and a way back.",
      },
      {
        q: "Do you use infrastructure as code?",
        a: "Yes. Environments are described in Terraform, kept in version control and applied through review, so changes are repeatable and easy to undo.",
      },
      {
        q: "Can you look at what we already run?",
        a: "Yes. A review of an existing cloud account for cost and security looks for unused resources, over-sized services, open ports and over-broad permissions.",
      },
    ],
  },
  "it-services": {
    needFromYou: [
      "A walk through your accounts, devices, network and backups, or access to them.",
      "Who is affected by each change, so they can be given notice.",
      "Your priorities, since we order fixes by risk and effort and you decide which come first.",
    ],
    faq: [
      {
        q: "What does an IT health check cover?",
        a: "It starts with a review of accounts, devices, network and backups, and ends with a short written list of what to fix, ordered by risk and effort.",
      },
      {
        q: "What does security work involve?",
        a: "Practical basics: multi-factor authentication, sensible permissions, patching, device encryption and backups, plus guidance for staff.",
      },
      {
        q: "Do you support teams without an in-house IT person?",
        a: "Yes. Ongoing support for a team without an in-house IT person is one of the typical ways people ask for this.",
      },
      {
        q: "Will a migration disrupt our work?",
        a: "We make changes in planned windows and give notice to the people affected.",
      },
    ],
  },
};
