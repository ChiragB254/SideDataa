import type { Card } from "@/content/cards";
import { cardOrigin } from "@/content/cards";
import { site } from "@/lib/site";

/** Escape a vCard 3.0 text value (RFC 2426 section 4): backslash, comma, semicolon, newline. */
export function escapeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

const encoder = new TextEncoder();

/**
 * Fold a content line at 75 octets (RFC 2426 section 2.6): continuation lines start
 * with one space. Never splits a multi-byte UTF-8 character.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74; // the leading space counts as one octet
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function splitName(full: string): { given: string; family: string } {
  const words = full.trim().split(/\s+/);
  if (words.length === 1) return { given: words[0] ?? "", family: "" };
  return { given: words.slice(0, -1).join(" "), family: words[words.length - 1] ?? "" };
}

/** Build a vCard 3.0 file (CRLF line endings, folded lines) for a card. */
export function buildVCard(card: Card): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  if (card.kind === "person") {
    const { given, family } = splitName(card.name);
    lines.push(`FN:${escapeValue(card.name)}`);
    lines.push(`N:${escapeValue(family)};${escapeValue(given)};;;`);
    lines.push(`ORG:${escapeValue(site.name)}`);
    if (card.title) lines.push(`TITLE:${escapeValue(card.title)}`);
  } else {
    lines.push(`FN:${escapeValue(card.name)}`);
    lines.push("N:;;;;");
    lines.push(`ORG:${escapeValue(card.name)}`);
    lines.push("X-ABShowAs:COMPANY");
  }
  lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeValue(card.email)}`);
  if (card.phoneDial) lines.push(`TEL;TYPE=WORK,VOICE:${escapeValue(card.phoneDial)}`);
  lines.push(`URL:${cardOrigin}`);
  if (card.linkedin) lines.push(`URL;TYPE=LinkedIn:${escapeValue(card.linkedin)}`);
  // ADR order: PO box; extended; street; locality; region; postal code; country.
  lines.push(
    `ADR;TYPE=WORK:;;;${escapeValue(site.locality)};${escapeValue(site.region)};;${escapeValue(site.country)}`,
  );
  lines.push("END:VCARD");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
