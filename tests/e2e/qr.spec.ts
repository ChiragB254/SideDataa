import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { cards, cardUrl } from "../../content/cards";
import { qrCodes } from "../../content/generated/qr";
import { makeQr, qrSvg, QUIET_ZONE } from "../../scripts/cards/qr";

// Browser-dependent QR checks (rasterise an SVG, decode a PNG). The browser-free
// checks are in tests/unit/qr.test.ts.

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

test("every card's QR SVG, in site and one-colour print colours, decodes to its URL", async ({
  page,
}) => {
  await page.goto("/healthz");
  const variants = [
    { dark: "#1b1f23", light: "#faf9f6" }, // website and colour print
    { dark: "#000000", light: "#ffffff" }, // one-colour print
  ];
  for (const variant of variants) {
    for (const c of cards) {
      const px = await rasterise(page, qrSvg(makeQr(cardUrl(c)), variant));
      expect(jsQR(px, SIDE, SIDE)?.data, `${c.slug} ${variant.dark}`).toBe(cardUrl(c));
    }
  }
});

test("the committed path data the website renders decodes in a browser", async ({
  page,
}) => {
  await page.goto("/healthz");
  for (const c of cards) {
    const q = qrCodes[c.slug]!;
    const px = await rasterise(
      page,
      qrSvg({ modules: q.size - 2 * QUIET_ZONE, size: q.size, path: q.path }),
    );
    expect(jsQR(px, SIDE, SIDE)?.data, c.slug).toBe(q.url);
  }
});

test("the QR on each rendered /card page decodes from a screenshot", async ({ page }) => {
  for (const [route, c] of [
    ["/card", cards[0]!],
    ["/card/chirag-bansal", cards[1]!],
  ] as const) {
    await page.goto(route);
    const shot = await page
      .locator("article svg[shape-rendering='crispEdges']")
      .screenshot({ scale: "device" });
    const px = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
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
    }, shot.toString("base64"));
    expect(jsQR(Uint8ClampedArray.from(px.d), px.w, px.h)?.data, route).toBe(cardUrl(c));
  }
});

test("printed back sides (300 dpi PNG previews in design/cards) decode to the card URL", async ({
  page,
}) => {
  await page.goto("/healthz");
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
    expect(jsQR(Uint8ClampedArray.from(px.d), px.w, px.h)?.data, c.slug).toBe(cardUrl(c));
    checked++;
  }
  expect(checked).toBeGreaterThan(0); // the company card output is committed
});
