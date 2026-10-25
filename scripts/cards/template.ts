import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brand, heroArtSvg, logoMarkSvg } from "../../lib/brand-art";
import { cardTagline, cardUrl, type Card } from "../../content/cards";
import { site } from "../../lib/site";
import { makeQr } from "./qr";

/*
 * Print template for one business card, as HTML/CSS in millimetres.
 *
 *   trim  88.9 x 50.8 mm   (3.5 x 2 in)
 *   bleed 3.175 mm (0.125 in) on every side
 *   page  95.25 x 57.15 mm (3.75 x 2.25 in)
 *   safe  every text and QR symbol sits at least 3.175 mm inside the trim
 *         (6.35 mm from the page edge)
 *
 * Only ink #1B1F23 and accent #2F5D62 on paper #FAF9F6. The one-colour variant prints
 * everything in black on unprinted stock.
 */
export const BLEED_MM = 3.175;
export const SAFE_MM = 3.175;
export const PAGE_W_MM = 95.25;
export const PAGE_H_MM = 57.15;
const EDGE = BLEED_MM + SAFE_MM; // 6.35 mm from the page edge

const FONT_DIR = join(process.cwd(), "assets/fonts");
const fontFace = (family: string, weight: number, file: string) =>
  `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;` +
  `src:url(data:font/woff;base64,${readFileSync(join(FONT_DIR, file)).toString("base64")}) format("woff");}`;

const FONTS = [
  fontFace("Source Serif 4", 400, "SourceSerif4-Regular.woff"),
  fontFace("Source Serif 4", 500, "SourceSerif4-Medium.woff"),
  fontFace("IBM Plex Sans", 400, "IBMPlexSans-Regular.woff"),
  fontFace("IBM Plex Sans", 500, "IBMPlexSans-Medium.woff"),
  fontFace("IBM Plex Sans", 600, "IBMPlexSans-SemiBold.woff"),
].join("");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type Side = "front" | "back";
export type TemplateOptions = { mono?: boolean; guides?: boolean; sides?: Side[] };

function colours(mono: boolean) {
  return mono
    ? {
        paper: "none",
        ink: "#000000",
        accent: "#000000",
        soft: "#000000",
        fillArt: "#ffffff",
      }
    : {
        paper: brand.paper,
        ink: brand.ink,
        accent: brand.accent,
        soft: brand.inkSoft,
        fillArt: brand.paper,
      };
}

function wordmark(size: "sm" | "md") {
  return `<div class="brand ${size}">${logoMarkSvg({ ink: "var(--ink)", accent: "var(--accent)" })}
    <span class="wm"><span class="wm1">${brand.wordmark.primary}</span><span class="wm2">${brand.wordmark.secondary}</span></span></div>`;
}

function front(card: Card, c: ReturnType<typeof colours>): string {
  const art = heroArtSvg({
    line: c.accent,
    accent: c.accent,
    fill: c.fillArt,
    strokeWidth: 2.4,
  });
  const person = card.kind === "person";
  return `<section class="page front${person ? " person-front" : ""}">
    <div class="art">${art}</div>
    ${wordmark("md")}
    ${
      person
        ? `<div class="person"><h1>${esc(card.name)}</h1><p class="title">${esc(card.title ?? "")}</p></div>`
        : `<p class="tagline">${esc(cardTagline)}</p>`
    }
  </section>`;
}

function back(card: Card, c: ReturnType<typeof colours>): string {
  const qr = makeQr(cardUrl(card));
  const dark = c.ink;
  const qrSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges">` +
    `<path fill="${dark}" d="${qr.path}"/></svg>`;
  const rows: string[] = [`<li><span class="k">Email</span>${esc(card.email)}</li>`];
  if (card.phone) rows.push(`<li><span class="k">Phone</span>${esc(card.phone)}</li>`);
  rows.push(`<li><span class="k">Web</span>sidedataa.com</li>`);
  rows.push(`<li><span class="k">Office</span>${esc(site.locationLabel)}</li>`);
  return `<section class="page back">
    <div class="band"></div>
    ${wordmark("sm")}
    <ul class="contact">${rows.join("")}</ul>
    <p class="scan">Scan for the digital card.</p>
    <div class="qr">${qrSvg}</div>
  </section>`;
}

export function cardHtml(card: Card, opts: TemplateOptions = {}): string {
  const mono = opts.mono ?? false;
  const c = colours(mono);
  const sides = opts.sides ?? ["front", "back"];
  const pages = sides
    .map((s) => (s === "front" ? front(card, c) : back(card, c)))
    .join("");
  const guides = opts.guides
    ? `<style>
        .guide{position:absolute;box-sizing:border-box;pointer-events:none;z-index:9}
        .trim{inset:${BLEED_MM}mm;border:0.2mm dashed #e0007a}
        .safe{inset:${EDGE}mm;border:0.2mm dashed #0099cc}
      </style>`
    : "";
  const guideEls = opts.guides
    ? `<div class="guide trim"></div><div class="guide safe"></div>`
    : "";
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8">
<title>${esc(card.name)} business card</title>
<style>
${FONTS}
@page{size:${PAGE_W_MM}mm ${PAGE_H_MM}mm;margin:0}
:root{--paper:${c.paper};--ink:${c.ink};--accent:${c.accent};--soft:${c.soft}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${PAGE_W_MM}mm;background:${mono ? "#fff" : c.paper}}
body{font-family:"IBM Plex Sans",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
.page{position:relative;width:${PAGE_W_MM}mm;height:${PAGE_H_MM}mm;overflow:hidden;background:var(--paper);page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
svg{display:block}
.brand{position:absolute;left:${EDGE}mm;top:${EDGE}mm;display:flex;align-items:center;gap:2.2mm}
.brand svg{width:6.2mm;height:6.2mm}
.brand.sm svg{width:5mm;height:5mm}
.wm{display:flex;align-items:baseline;gap:1.2mm;line-height:1}
.wm1{font-family:"Source Serif 4",serif;font-weight:500;font-size:12.5pt;letter-spacing:-.01em}
.brand.sm .wm1{font-size:10pt}
.wm2{font-weight:600;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
/* front */
.front .art{position:absolute;left:46mm;top:17mm;width:60mm}
.person-front .art{left:51mm}
.front .art svg{width:100%;height:auto}
.tagline{position:absolute;left:${EDGE}mm;bottom:${EDGE}mm;width:36mm;font-family:"Source Serif 4",serif;font-weight:500;font-size:11pt;line-height:1.22;letter-spacing:-.005em}
.person{position:absolute;left:${EDGE}mm;bottom:${EDGE}mm;width:60mm}
.person h1{font-family:"Source Serif 4",serif;font-weight:500;font-size:19pt;line-height:1.05;letter-spacing:-.012em}
.person .title{margin-top:1.6mm;font-weight:500;font-size:9pt;color:var(--accent);line-height:1.2}
/* back */
.band{position:absolute;left:0;top:0;bottom:0;width:${BLEED_MM + 2.6}mm;background:var(--accent)}
.back .brand{left:${BLEED_MM + 2.6 + 3.2}mm}
.contact{position:absolute;left:${BLEED_MM + 2.6 + 3.2}mm;bottom:${EDGE + 5.6}mm;list-style:none;font-size:8pt;line-height:1.2;width:52mm}
.contact li{display:flex;gap:2mm;align-items:baseline;margin-top:1.5mm;white-space:nowrap}
.contact .k{flex:0 0 9.5mm;font-size:7pt;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.scan{position:absolute;left:${BLEED_MM + 2.6 + 3.2}mm;bottom:${EDGE + 0.8}mm;font-size:7pt;line-height:1.2;color:var(--soft)}
.qr{position:absolute;right:${PAGE_W_MM - 88.9 - 2.6 + 1.4}mm;top:${(PAGE_H_MM - 24) / 2}mm;width:24mm;height:24mm}
.qr svg{width:100%;height:100%}
</style>${guides}</head><body>${pages.replace(/<\/section>/g, `${guideEls}</section>`)}</body></html>`;
  return html;
}
