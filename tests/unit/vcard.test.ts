import { describe, expect, it } from "vitest";
import { buildVCard, escapeValue, foldLine } from "@/lib/vcard";
import { cards, getCard, type Card } from "@/content/cards";

const company = getCard("sidedata") as Card;
const person = getCard("chirag-bansal") as Card;

describe("escapeValue", () => {
  it("escapes backslash, comma, semicolon and newlines", () => {
    expect(escapeValue("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("FN:Short")).toBe("FN:Short");
  });
  it("folds at 75 octets with CRLF + space and unfolds losslessly", () => {
    const line = "NOTE:" + "x".repeat(200);
    const folded = foldLine(line);
    for (const part of folded.split("\r\n")) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });
  it("never splits a multi-byte character", () => {
    const line = "FN:" + "é".repeat(80);
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
    expect(folded).not.toContain("�");
  });
});

describe("company vCard", () => {
  const v = buildVCard(company);
  it("is a CRLF-terminated vCard 3.0", () => {
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(v.endsWith("END:VCARD\r\n")).toBe(true);
    expect(v.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });
  it("has FN, N, ORG, EMAIL, URL and a locality-only ADR", () => {
    expect(v).toContain("FN:SideData Technologies\r\n");
    expect(v).toContain("N:;;;;\r\n");
    expect(v).toContain("ORG:SideData Technologies\r\n");
    expect(v).toContain("EMAIL;TYPE=INTERNET,WORK:support@sidedataa.com\r\n");
    expect(v).toContain("URL:https://sidedataa.com\r\n");
    expect(v).toContain("ADR;TYPE=WORK:;;;Toronto;Ontario;;Canada\r\n");
  });
  it("has no TITLE, TEL or NOTE", () => {
    expect(v).not.toMatch(/^(TITLE|TEL|NOTE)/m);
  });
});

describe("person vCard", () => {
  const v = buildVCard(person);
  it("has name, TITLE, EMAIL and TEL", () => {
    expect(v).toContain("FN:Chirag Bansal\r\n");
    expect(v).toContain("N:Bansal;Chirag;;;\r\n");
    expect(v).toContain("ORG:SideData Technologies\r\n");
    expect(v).toContain("TITLE:CEO\r\n");
    expect(v).toContain("EMAIL;TYPE=INTERNET,WORK:chirag.bansal@sidedataa.com\r\n");
    expect(v).toContain("TEL;TYPE=WORK,VOICE:+14374313144\r\n");
    expect(v).toContain("ADR;TYPE=WORK:;;;Toronto;Ontario;;Canada\r\n");
  });
  it("includes no LinkedIn line when none is supplied", () => {
    expect(v).not.toContain("LinkedIn");
  });
});

describe("phone numbers", () => {
  it("only cards that carry a phone get TEL", () => {
    for (const c of cards) {
      expect(/^TEL/m.test(buildVCard(c))).toBe(Boolean(c.phoneDial));
    }
  });
});
