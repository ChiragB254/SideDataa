import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { cards, cardUrl } from "@/content/cards";
import { qrCodes } from "@/content/generated/qr";
import { OUT, renderQrModule } from "../../scripts/cards/generate-qr";
import { QUIET_ZONE } from "../../scripts/cards/qr";

// Pure Node: no browser. Browser rasterising and the print-PNG decode live in
// tests/e2e/qr.spec.ts.

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

/** Paint the committed path data ("Mx yhNv1h-Nz" runs) into an RGBA bitmap. */
function paint(size: number, path: string, scale: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(size * scale * size * scale * 4).fill(255);
  for (const m of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [x, y, run] = [Number(m[1]), Number(m[2]), Number(m[3])];
    for (let py = y * scale; py < (y + 1) * scale; py++) {
      for (let pxx = x * scale; pxx < (x + run) * scale; pxx++) {
        const i = (py * size * scale + pxx) * 4;
        px[i] = px[i + 1] = px[i + 2] = 0x1b;
      }
    }
  }
  return px;
}

describe("QR path data decodes to the card URL", () => {
  it("decodes each committed path with jsQR", () => {
    for (const c of cards) {
      const q = qrCodes[c.slug]!;
      const scale = 8;
      const px = paint(q.size, q.path, scale);
      expect(jsQR(px, q.size * scale, q.size * scale)?.data, c.slug).toBe(cardUrl(c));
    }
  });
});
