import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/*
 * Crawler policy. Search and assistant crawlers are explicitly allowed (the SEO research
 * brief, docs/seo/research-brief.md, recommends it): blocking OAI-SearchBot, Claude-SearchBot
 * or PerplexityBot can leave the site out of AI answers.
 *
 * Training crawlers (GPTBot, ClaudeBot, Google-Extended) are a BUSINESS CHOICE. They are
 * allowed here; blocking them does not affect search inclusion. To block them, move
 * "GPTBot", "ClaudeBot" and "Google-Extended" out of `allowedBots` into a rule with
 * `disallow: "/"` (one line: `{ userAgent: trainingBots, disallow: "/" }`).
 *
 * Every group repeats the disallow list: a crawler follows only the most specific group
 * that names it, so a bare "allow: /" would otherwise re-open /api/ and /form-status.
 * Any agent not named falls under "*" (allowed by default, same disallows).
 */
const disallow = ["/api/", "/form-status"];

const allowedBots = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...allowedBots.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
