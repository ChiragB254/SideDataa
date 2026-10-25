import { writeFile } from "node:fs/promises";
import { cards } from "../../content/cards";
import { OUT, renderQrModule } from "./generate-qr";

async function main() {
  await writeFile(OUT, await renderQrModule());
  console.log(`Wrote ${OUT} (${cards.length} QR codes)`);
}

void main();
