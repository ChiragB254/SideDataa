import { describe, expect, it } from "vitest";
import {
  HORIZON,
  defaultValues,
  estimate,
  validateInputs,
  type Currency,
  type FieldValues,
} from "@/lib/estimator";
import {
  DISPLAY_CAP,
  announcement,
  breakEvenText,
  buildCsv,
  buildSummaryText,
  csvText,
  explainSteps,
  invalidAnnouncement,
  makeFormatters,
  paybackText,
  roiText,
} from "@/lib/estimator-format";

const cad: Currency = { code: "CAD", otherLabel: "" };
const other = (otherLabel: string): Currency => ({ code: "OTHER", otherLabel });

function est(over: Partial<FieldValues> = {}) {
  const v = validateInputs({ ...defaultValues, ...over });
  if (!v.ok) throw new Error("invalid");
  return estimate(v.numbers);
}

// Intl output uses non-breaking spaces and minus signs in some locales; compare loosely.
const plain = (s: string) => s.replace(/[  ]/g, " ").replace(/−/g, "-");

describe("formatting", () => {
  it("formats money for a custom label", () => {
    const f = makeFormatters(other("R"));
    expect(f.money(1234.5)).toBe("R1,235");
    expect(f.money(-1234)).toBe("-R1,234");
    expect(makeFormatters(other("AED")).money(1500)).toBe("AED 1,500");
  });

  it("formats ISO currencies with a symbol and thousands separators", () => {
    expect(plain(makeFormatters(cad).money(1234567))).toMatch(/^\$1,234,567$/);
    expect(plain(makeFormatters({ code: "EUR", otherLabel: "" }).money(-50))).toMatch(
      /^-€50$/,
    );
    expect(plain(makeFormatters({ code: "INR", otherLabel: "" }).money(10))).toContain(
      "10",
    );
  });

  it("never prints negative zero", () => {
    const f = makeFormatters(other("R"));
    expect(f.money(-0.2)).toBe("R0");
    expect(f.number(-0)).toBe("0");
  });

  it("caps huge values and handles NaN and Infinity", () => {
    const f = makeFormatters(other("R"));
    expect(f.money(DISPLAY_CAP * 10)).toBe("more than R1,000,000,000,000");
    expect(f.money(-DISPLAY_CAP * 10)).toBe("less than -R1,000,000,000,000");
    expect(f.money(NaN)).toBe("not available");
    expect(f.money(Infinity)).toBe("not available");
    expect(f.number(NaN)).toBe("not available");
  });

  it("formats hours, percent and short axis labels", () => {
    const f = makeFormatters(other("R"));
    expect(f.hours(39.2)).toBe("39.2 hours");
    expect(f.hours(1)).toBe("1 hour");
    expect(f.percent(24.057, 1)).toBe("24.1%");
    expect(f.moneyShort(12500)).toBe("R12.5K");
    expect(f.moneyShort(-20000)).toBe("-R20K");
  });

  it("describes payback and ROI", () => {
    expect(paybackText(18)).toBe("month 18");
    expect(paybackText(null)).toBe("not within 36 months");
    const f = makeFormatters(other("R"));
    expect(roiText(0.372, f)).toBe("37%");
    expect(roiText(null, f)).toMatch(/not available/);
  });
});

describe("text output", () => {
  const f = makeFormatters(other("R"));
  const e = est();

  it("announces the expected case in one sentence", () => {
    expect(announcement(e, f)).toBe(
      "Expected case: net saving per month R924 at full adoption, payback in month 18.",
    );
    expect(announcement(est({ runCost: "5000" }), f)).toMatch(
      /net cost per month R\d[\d,]* at full adoption, payback not within 36 months\./,
    );
    expect(invalidAnnouncement(1)).toBe("Results paused: 1 field needs attention.");
    expect(invalidAnnouncement(3)).toBe("Results paused: 3 fields need attention.");
  });

  it("explains each step with the user's own numbers", () => {
    const steps = explainSteps(e, f);
    const text = steps.map((s) => `${s.title} ${s.formula} ${s.working}`).join("\n");
    expect(steps.length).toBeGreaterThanOrEqual(10);
    expect(text).toContain("400 x 12 / 60 = 80 hours");
    expect(text).toContain("39.2 hours");
    expect(text).toContain("R924 a month");
    expect(text).toContain("month 18");
    expect(text).toContain("37%");
  });

  it("states each break-even outcome in words", () => {
    expect(breakEvenText({ kind: "needed", fullSharePct: 24.0571 }, f)).toContain(
      "24.1%",
    );
    expect(breakEvenText({ kind: "already" }, f)).toMatch(
      /even if AI fully handles none/,
    );
    expect(breakEvenText({ kind: "unreachable" }, f)).toMatch(/does not break even/);
    expect(breakEvenText({ kind: "never" }, f)).toMatch(/review time costs as much/);
  });

  it("builds a plain-text summary with inputs, results and exclusions", () => {
    const t = buildSummaryText(e, other("R"), f, "Made on 31 October 2026.");
    expect(t).toContain("planning aid, not a forecast or a quote");
    expect(t).toContain("- Tasks per month: 400 tasks");
    expect(t).toContain("- Fully loaded cost per person-hour: R45 per hour");
    expect(t).toContain("- Net per month at full adoption: R924");
    expect(t).toContain("- Payback: month 18");
    expect(t).toContain("Conservative: x0.5 / x1.3");
    expect(t).toContain("Not included:");
    expect(t).not.toMatch(/!/);
  });
});

describe("CSV", () => {
  const e = est();
  const csv = buildCsv(e, other("R"), "Made on 31 October 2026.");
  const lines = csv.replace(/^﻿/, "").split("\r\n");

  it("starts with a byte order mark and ends with CRLF", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("has a 36-month table with month 0 to 36", () => {
    const header = lines.findIndex((l) => l.startsWith("Month,"));
    expect(header).toBeGreaterThan(0);
    const body = lines.slice(header + 1).filter(Boolean);
    expect(body).toHaveLength(HORIZON + 1);
    expect(body[0]?.split(",")[0]).toBe("0");
    expect(body[HORIZON]?.split(",")[0]).toBe("36");
    // Month 3, Expected: net 924, cumulative -13752; columns 5 and 6 of the row.
    const cells = body[3]?.split(",") ?? [];
    expect(cells[0]).toBe("3");
    expect(cells[1]).toBe("100");
    expect(cells[4]).toBe("924");
    expect(cells[5]).toBe("-13752");
  });

  it("lists inputs, multipliers and assumptions", () => {
    expect(csv).toContain("Tasks per month,400,tasks");
    expect(csv).toContain("Conservative,0.5,1.3");
    expect(csv).toContain("Run cost is charged in full from month 1");
    expect(csv).toContain("Currency label: R");
    expect(csv).toContain("Payback month,not within 36 months,18,13");
  });

  it("quotes cells with commas and quotes", () => {
    expect(csvText('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvText("plain")).toBe("plain");
    expect(csvText("a\nb")).toBe('"a\nb"');
  });

  it("neutralises spreadsheet formulas in text cells", () => {
    expect(csvText("=HYPERLINK(1)")).toBe(" =HYPERLINK(1)");
    expect(csvText("+1")).toBe(" +1");
    expect(csvText("-1")).toBe(" -1");
    expect(csvText("@SUM(A1)")).toBe(" @SUM(A1)");
    const evil = buildCsv(e, other("=1+1"), "d");
    // The label sits mid-cell here, so it is safe as is.
    expect(evil).toContain("Currency label: =1+1");
  });
});
