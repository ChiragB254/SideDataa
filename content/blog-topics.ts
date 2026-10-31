import type { ServiceSlug } from "./services";

/**
 * Blog topics. A topic page (/blog/topic/<slug>) is generated only when the topic has
 * at least MIN_POSTS_FOR_HUB published posts, so these definitions cost nothing until
 * there is content. Each intro is a short, factual description of what the posts cover:
 * keep it free of claims about results, clients or rankings.
 */
export const MIN_POSTS_FOR_HUB = 2;

export type Topic = {
  slug: string;
  name: string;
  /** One or two plain sentences shown at the top of the topic page. */
  intro: string;
  /** The service page that posts in this topic link up to. */
  service: ServiceSlug;
};

export const topics: readonly Topic[] = [
  {
    slug: "ai",
    name: "AI and language models",
    intro:
      "Articles about building with language models: retrieval over your own documents, evaluating answers, costs, and when AI is the wrong tool.",
    service: "ai-development",
  },
  {
    slug: "web",
    name: "Websites and web applications",
    intro:
      "Articles about building and maintaining websites and web applications: structure, accessibility, performance and handover.",
    service: "web-development",
  },
  {
    slug: "servers",
    name: "Servers and operations",
    intro:
      "Articles about running servers: patching, monitoring, backups and restore tests, and keeping setups documented.",
    service: "server-management",
  },
  {
    slug: "cloud",
    name: "Cloud and infrastructure",
    intro:
      "Articles about designing, migrating and running workloads on AWS, Google Cloud and Microsoft Azure, including cost and access control.",
    service: "cloud-services",
  },
  {
    slug: "it",
    name: "IT and security basics",
    intro:
      "Articles about everyday IT for small organisations: accounts, devices, networks, backups and practical security habits.",
    service: "it-services",
  },
];

export function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}
