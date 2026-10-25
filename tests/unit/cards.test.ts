import { describe, expect, it } from "vitest";
import {
  assertValidCards,
  cardPath,
  cardUrl,
  cards,
  slugPattern,
  type Card,
} from "@/content/cards";

const base: Card = { slug: "sidedata", kind: "company", name: "X", email: "a@b.co" };

describe("card data", () => {
  it("ships a company card and the supplied person", () => {
    expect(cards.map((c) => c.slug)).toEqual(["sidedata", "chirag-bansal"]);
    expect(cards.filter((c) => c.kind === "person")).toHaveLength(1);
  });
  it("keeps the phone on the person card only", () => {
    expect(cards.find((c) => c.slug === "sidedata")?.phone).toBeUndefined();
    expect(cards.find((c) => c.slug === "chirag-bansal")?.phone).toBe("+1 437 431 3144");
  });
  it("builds canonical URLs", () => {
    expect(cardUrl(cards[0] as Card)).toBe("https://sidedataa.com/card");
    expect(cardPath(cards[1] as Card)).toBe("/card/chirag-bansal");
    expect(cardUrl(cards[1] as Card)).toBe("https://sidedataa.com/card/chirag-bansal");
  });
  it("validates slugs", () => {
    expect(slugPattern.test("a-b-9")).toBe(true);
    for (const bad of ["A", "a b", "a/b", "a_b", "", "é"]) {
      expect(() => assertValidCards([base, { ...base, slug: bad }])).toThrow();
    }
  });
  it("rejects duplicates, person without title, phone without dial number", () => {
    expect(() => assertValidCards([base, base])).toThrow(/Duplicate/);
    expect(() =>
      assertValidCards([base, { ...base, slug: "p", kind: "person" }]),
    ).toThrow(/title/);
    expect(() => assertValidCards([{ ...base, phone: "+1 1" }])).toThrow(/together/);
    expect(() => assertValidCards([{ ...base, slug: "other" }])).toThrow(/required/);
  });
});
