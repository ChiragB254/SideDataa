import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chromium, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { cards, cardUrl } from "@/content/cards";
import { qrCodes } from "@/content/generated/qr";
import { OUT, renderQrModule } from "../../scripts/cards/generate-qr";
import { makeQr, qrSvg, QUIET_ZONE } from "../../scripts/cards/qr";

const SIDE = 444;

/** Rasterise an SVG document in Chromium and return RGBA pixels. */
async function rasterise(page: Page, svg: string): Promise<Uint8ClampedArray> {
  const px = await page.evaluate(
    async ([markup, side]) => {
      const img = new Image();
      img.src =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup as string);
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = side as number;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, side as number, side as number);
      return Array.from(ctx.getImageData(0, 0, side as number, side as number).data);
    },
    [svg, SIDE] as const,
  );
  return Uint8ClampedArray.from(px);
}

describe("generated QR module", () => {
  it("is in sync with content/cards.ts (run `npm run cards:qr` if this fails)", async () => {
    expect(readFileSync(OUT, "utf8")).toBe(await renderQrModule());
  });
  it("has one QR per card with the canonical URL and a 4-module quiet zone", () => {
    for (const c of cards) {
      const q = qrCodes[c.slug];
      expect(q?.url).toBe(cardUrl(c));
      expect(q?.path.startsWith(`M${QUIET_ZONE} ${QUIET_ZONE}`)).toBe(true);
    }
    expect(Object.keys(qrCodes).sort()).toEqual(cards.map((c) => c.slug).sort());
  });
});

describe("QR codes decode to the card URL", () => {
  it("rasterises each SVG in Chromium and decodes it with jsQR", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const variants = [
        { dark: "#1b1f23", light: "#faf9f6" }, // website and colour print
        { dark: "#000000", light: "#ffffff" }, // one-colour print
      ];
      for (const variant of variants) {
        for (const c of cards) {
          const px = await rasterise(page, qrSvg(makeQr(cardUrl(c)), variant));
          expect(jsQR(px, SIDE, SIDE)?.data, `${c.slug} ${variant.dark}`).toBe(
            cardUrl(c),
          );
        }
      }
      // The committed path data (what the website renders) decodes too.
      for (const c of cards) {
        const q = qrCodes[c.slug]!;
        const px = await rasterise(
          page,
          qrSvg({ modules: q.size - 2 * QUIET_ZONE, size: q.size, path: q.path }),
        );
        expect(jsQR(px, SIDE, SIDE)?.data, c.slug).toBe(q.url);
      }
    } finally {
      await browser.close();
    }
  }, 60_000);
});

describe("printed card QR codes", () => {
  it("decode from the 300 dpi back-side previews (design/cards, if generated)", async () => {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      let checked = 0;
      for (const c of cards) {
        const file = `design/cards/${c.slug}/${c.slug}-back.png`;
        if (!existsSync(file)) continue;
        const b64 = readFileSync(file).toString("base64");
        const px = await page.evaluate(async (src) => {
          const img = new Image();
          img.src = src;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          return {
            w: img.width,
            h: img.height,
            d: Array.from(ctx.getImageData(0, 0, img.width, img.height).data),
          };
        }, `data:image/png;base64,${b64}`);
        const found = jsQR(Uint8ClampedArray.from(px.d), px.w, px.h);
        expect(found?.data, c.slug).toBe(cardUrl(c));
        checked++;
      }
      expect(checked).toBeGreaterThan(0); // the company card output is committed
    } finally {
      await browser.close();
    }
  }, 60_000);
});
