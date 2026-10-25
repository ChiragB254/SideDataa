import QRCode from "qrcode";

export const QUIET_ZONE = 4; // modules, per ISO/IEC 18004
export const ERROR_CORRECTION = "Q" as const;

export type Qr = {
  /** Modules per side of the symbol itself, without the quiet zone. */
  modules: number;
  /** Side of the whole drawing in modules: symbol plus quiet zone on every side. */
  size: number;
  /** SVG path data for the dark modules, in module units, offset by the quiet zone. */
  path: string;
};

/** Encode `text` as a QR symbol (error correction Q) and return merged-row path data. */
export function makeQr(text: string): Qr {
  const qr = QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const segments: string[] = [];
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!data[y * n + x]) {
        x++;
        continue;
      }
      let run = 0;
      while (x + run < n && data[y * n + x + run]) run++;
      segments.push(`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h${run}v1h-${run}z`);
      x += run;
    }
  }
  return { modules: n, size: n + QUIET_ZONE * 2, path: segments.join("") };
}

/** A standalone SVG document (light background, dark modules) for a QR. */
export function qrSvg(
  qr: Qr,
  { dark = "#1b1f23", light = "#faf9f6" }: { dark?: string; light?: string } = {},
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges">` +
    `<rect width="${qr.size}" height="${qr.size}" fill="${light}"/>` +
    `<path fill="${dark}" d="${qr.path}"/></svg>`
  );
}
