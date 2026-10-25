/*
 * Renders every card in content/cards.ts to print-ready files in design/cards/<slug>/.
 * Dev-only. Needs Chromium (`npx playwright install chromium`).
 *
 *   <slug>-print.pdf             colour, 2 pages (front, back), 3.75 x 2.25 in with 0.125 in bleed
 *   <slug>-print-1colour.pdf     black only variant, same pages
 *   <slug>-front.png / -back.png                 300 dpi previews (1125 x 675 px, includes bleed)
 *   <slug>-front-guides.png / -back-guides.png   same, with trim (magenta) and safe (cyan) lines
 *
 * Usage: npm run cards:print [-- slug ...]   (no slug = every card)
 * No network: fonts come from assets/fonts and are embedded in the PDF; any request
 * to a non-data URL is blocked.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { cards } from "../../content/cards";
import { cardHtml, PAGE_H_MM, PAGE_W_MM, type Side } from "./template";

const OUT_ROOT = join(process.cwd(), "design/cards");
const DPI = 300;
const CSS_PX_PER_MM = 96 / 25.4;

async function main() {
  const wanted = process.argv.slice(2);
  const selected = wanted.length ? cards.filter((c) => wanted.includes(c.slug)) : cards;
  if (!selected.length) throw new Error(`No card matches: ${wanted.join(", ")}`);

  const browser = await chromium.launch();
  try {
    for (const card of selected) {
      const dir = join(OUT_ROOT, card.slug);
      await mkdir(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: {
          width: Math.ceil(PAGE_W_MM * CSS_PX_PER_MM),
          height: Math.ceil(PAGE_H_MM * CSS_PX_PER_MM),
        },
        deviceScaleFactor: DPI / 96,
      });
      await context.route("**/*", (route) =>
        route.request().url().startsWith("data:") ||
        route.request().url().startsWith("about:")
          ? route.continue()
          : route.abort(),
      );
      const page = await context.newPage();

      for (const mono of [false, true]) {
        await page.setContent(cardHtml(card, { mono }), { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const pdf = await page.pdf({
          width: `${PAGE_W_MM}mm`,
          height: `${PAGE_H_MM}mm`,
          printBackground: true,
          preferCSSPageSize: true,
        });
        const name = `${card.slug}-print${mono ? "-1colour" : ""}.pdf`;
        await writeFile(join(dir, name), pdf);
        console.log(`wrote design/cards/${card.slug}/${name}`);
      }

      for (const side of ["front", "back"] as Side[]) {
        for (const guides of [false, true]) {
          await page.setContent(cardHtml(card, { sides: [side], guides }), {
            waitUntil: "load",
          });
          await page.evaluate(() => document.fonts.ready);
          const name = `${card.slug}-${side}${guides ? "-guides" : ""}.png`;
          await page.locator("section.page").screenshot({ path: join(dir, name) });
          console.log(`wrote design/cards/${card.slug}/${name}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

void main();
