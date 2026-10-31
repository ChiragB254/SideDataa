import { describe, expect, it } from "vitest";
import {
  HORIZON,
  adoptionAt,
  breakEvenFullShare,
  computeBase,
  defaultValues,
  estimate,
  niceScale,
  parseNumber,
  validateCurrency,
  validateInputs,
  type FieldValues,
  type Numbers,
} from "@/lib/estimator";

/*
 * Golden case, worked by hand from the example values:
 *   400 tasks x 12 min, 45 per hour, 40% fully handled, 30% assisted saving 30%,
 *   2 min review, build 15000, run 600, ramp 3 months.
 *   baseline hours      = 400 x 12 / 60                       = 80
 *   fully handled tasks = 160, assisted tasks = 120
 *   gross hours saved   = (160 x 12 + 120 x 12 x 0.3) / 60    = (1920 + 432) / 60 = 39.2
 *   review hours        = 160 x 2 / 60                        = 5.3333
 *   gross savings       = 39.2 x 45                           = 1764
 *   review cost         = 5.3333 x 45                         = 240
 *   net / month (full)  = 1764 - 240 - 600                    = 924
 *   Expected months 1..3: benefit 588/1176/1764, review 80/160/240, run 600
 *     net -92, 416, 924 -> cumulative -15092, -14676, -13752, then +924 a month
 *   payback: -13752 + 924 x j >= 0 -> j = 15 -> month 18
 *   cum12 = -13752 + 924 x 9 = -5436; cum24 = ... x 21 = 5652; cum36 = ... x 33 = 16740
 */
function nums(over: Partial<FieldValues> = {}): Numbers {
  const v = validateInputs({ ...defaultValues, ...over });
  if (!v.ok) throw new Error(JSON.stringify(v.errors));
  return v.numbers;
}

describe("validation and parsing", () => {
  it("parses plain, decimal and grouped numbers", () => {
    expect(parseNumber("1250")).toBe(1250);
    expect(parseNumber(" 1250.5 ")).toBe(1250.5);
    expect(parseNumber("1,250.50")).toBe(1250.5);
    expect(parseNumber("1 250")).toBe(1250);
  });

  it("rejects ambiguous or non-numeric text", () => {
    for (const bad of [
      "",
      "abc",
      "1,5",
      "-3",
      "1e5",
      "NaN",
      "Infinity",
      "12.",
      ".5",
      "1,23,456",
      "0x10",
    ]) {
      expect(Number.isNaN(parseNumber(bad)), bad).toBe(true);
    }
  });

  it("accepts the example values", () => {
    expect(validateInputs(defaultValues).ok).toBe(true);
  });

  it("reports empty required fields and allows empty optional ones", () => {
    const r = validateInputs({ ...defaultValues, tasksPerMonth: "", extraUnits: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.tasksPerMonth).toMatch(/Enter a number/);
    expect(r.errors.extraUnits).toBeUndefined();
  });

  it("enforces min, max and whole numbers with readable messages", () => {
    const err = (over: Partial<FieldValues>) => validateInputs({ ...defaultValues, ...over }).errors;
    expect(err({ fullSharePct: "101" }).fullSharePct).toMatch(/at most 100/);
    expect(err({ minutesPerTask: "0" }).minutesPerTask).toMatch(/at least 0.1/);
    expect(err({ tasksPerMonth: "10.5" }).tasksPerMonth).toMatch(/whole number/);
    expect(err({ rampMonths: "25" }).rampMonths).toMatch(/at most 24/);
    expect(err({ runCost: "twelve" }).runCost).toMatch(/must be a number/);
  });

  it("rejects fully-handled plus assisted shares above 100", () => {
    const r = validateInputs({ ...defaultValues, fullSharePct: "70", assistSharePct: "40" });
    expect(r.ok).toBe(false);
    expect(r.errors.assistSharePct).toMatch(/add up to 110%/);
    expect(
      validateInputs({ ...defaultValues, fullSharePct: "60", assistSharePct: "40" }).ok,
    ).toBe(true);
  });

  it("validates the custom currency label", () => {
    expect(validateCurrency({ code: "CAD", otherLabel: "" })).toBeNull();
    expect(validateCurrency({ code: "OTHER", otherLabel: " " })).toMatch(/Type a currency/);
    expect(validateCurrency({ code: "OTHER", otherLabel: "ABCDEFG" })).toMatch(
      /6 characters/,
    );
    expect(validateCurrency({ code: "OTHER", otherLabel: "AED" })).toBeNull();
  });
});

describe("base calculation (hand-worked golden case)", () => {
  const b = computeBase(nums());
  it("computes hours, savings and review", () => {
    expect(b.baselineHours).toBeCloseTo(80, 9);
    expect(b.baselineCost).toBeCloseTo(3600, 9);
    expect(b.fullTasks).toBeCloseTo(160, 9);
    expect(b.assistTasks).toBeCloseTo(120, 9);
    expect(b.grossHoursSaved).toBeCloseTo(39.2, 9);
    expect(b.reviewHours).toBeCloseTo(16 / 3, 9);
    expect(b.netHoursSaved).toBeCloseTo(39.2 - 16 / 3, 9);
    expect(b.grossLabourSavings).toBeCloseTo(1764, 9);
    expect(b.reviewCost).toBeCloseTo(240, 9);
    expect(b.errorSavings).toBe(0);
    expect(b.growthValue).toBe(0);
    expect(b.monthlyNet).toBeCloseTo(924, 9);
  });

  it("adds error and growth effects", () => {
    // errors: (20 - 5) x 30 = 450; growth: 10 x 200 x 50% = 1000
    const x = computeBase(
      nums({
        errorsBefore: "20",
        errorsAfter: "5",
        costPerError: "30",
        extraUnits: "10",
        valuePerUnit: "200",
        realisationPct: "50",
      }),
    );
    expect(x.errorSavings).toBeCloseTo(450, 9);
    expect(x.growthValue).toBeCloseTo(1000, 9);
    expect(x.grossBenefit).toBeCloseTo(1764 + 450 + 1000, 9);
    expect(x.monthlyNet).toBeCloseTo(1764 + 450 + 1000 - 240 - 600, 9);
  });

  it("lets error cost go negative when errors rise", () => {
    const x = computeBase(nums({ errorsBefore: "2", errorsAfter: "6", costPerError: "10" }));
    expect(x.errorSavings).toBe(-40);
  });
});

describe("adoption ramp", () => {
  it("is linear and capped at 1", () => {
    expect(adoptionAt(1, 4)).toBeCloseTo(0.25);
    expect(adoptionAt(2, 4)).toBeCloseTo(0.5);
    expect(adoptionAt(4, 4)).toBe(1);
    expect(adoptionAt(30, 4)).toBe(1);
  });
  it("treats a ramp below 1 as 1 (no division by zero)", () => {
    expect(adoptionAt(1, 0)).toBe(1);
    expect(adoptionAt(5, -3)).toBe(1);
  });
});

describe("scenarios (golden case)", () => {
  const est = estimate(nums());
  const [cons, exp, opt] = est.scenarios;

  it("Expected: ramp rows, payback and cumulative values", () => {
    expect(exp.rows).toHaveLength(HORIZON + 1);
    expect(exp.rows[0].cumulative).toBe(-15000);
    expect(exp.rows[1].net).toBeCloseTo(-92, 9);
    expect(exp.rows[2].net).toBeCloseTo(416, 9);
    expect(exp.rows[3].net).toBeCloseTo(924, 9);
    expect(exp.rows[3].cumulative).toBeCloseTo(-13752, 9);
    expect(exp.fullMonthlyNet).toBeCloseTo(924, 9);
    expect(exp.annualNet).toBeCloseTo(11088, 9);
    expect(exp.payback).toBe(18);
    expect(exp.cum12).toBeCloseTo(-5436, 9);
    expect(exp.cum24).toBeCloseTo(5652, 9);
    expect(exp.cum36).toBeCloseTo(16740, 9);
  });

  it("Expected: totals and ROI", () => {
    expect(exp.totalBenefit36).toBeCloseTo(61740, 6);
    expect(exp.totalCost36).toBeCloseTo(45000, 6);
    expect(exp.roi36).toBeCloseTo(0.372, 9);
    expect(exp.totalBenefit36 - exp.totalCost36).toBeCloseTo(exp.cum36, 6);
  });

  it("Conservative (savings x0.5, costs x1.3): never pays back", () => {
    expect(cons.savingsMult).toBe(0.5);
    expect(cons.costMult).toBe(1.3);
    expect(cons.rows[0].cumulative).toBeCloseTo(-19500, 9);
    expect(cons.fullMonthlyNet).toBeCloseTo(-210, 9);
    expect(cons.payback).toBeNull();
    expect(cons.cum36).toBeCloseTo(-27630, 9);
  });

  it("Optimistic (savings x1.25, costs x1): pays back in month 13", () => {
    expect(opt.fullMonthlyNet).toBeCloseTo(1365, 9);
    expect(opt.rows[1].net).toBeCloseTo(55, 9);
    expect(opt.payback).toBe(13);
    expect(opt.cum36).toBeCloseTo(32175, 9);
  });

  it("uses edited multipliers", () => {
    const e = estimate(nums({ expSave: "2", expCost: "0.5" }));
    // 1764 x 2 - (240 + 600) x 0.5 = 3528 - 420
    expect(e.expected.fullMonthlyNet).toBeCloseTo(3108, 9);
    expect(e.expected.rows[0].cumulative).toBeCloseTo(-7500, 9);
  });
});

describe("edge cases", () => {
  it("zero build cost, no ramp: pays back in month 1", () => {
    const e = estimate(nums({ buildCost: "0", rampMonths: "1" }));
    expect(e.expected.payback).toBe(1);
  });

  it("zero build cost with a ramp: waits until the cumulative is not negative", () => {
    // month 1 net -92 (cumulative -92), month 2 net 416 (cumulative 324).
    const e = estimate(nums({ buildCost: "0" }));
    expect(e.expected.rows[1].cumulative).toBeCloseTo(-92, 9);
    expect(e.expected.rows[2].cumulative).toBeCloseTo(324, 9);
    expect(e.expected.payback).toBe(2);
  });

  it("net of zero: no payback", () => {
    // gross 1764 - review 240 = 1524 = run cost
    const e = estimate(nums({ runCost: "1524", rampMonths: "1" }));
    expect(e.expected.fullMonthlyNet).toBeCloseTo(0, 6);
    expect(e.expected.payback).toBeNull();
    expect(e.expected.cum36).toBeCloseTo(-15000, 6);
  });

  it("negative net: no payback, break-even is unreachable", () => {
    const e = estimate(nums({ runCost: "5000" }));
    expect(e.expected.fullMonthlyNet).toBeLessThan(0);
    expect(e.expected.payback).toBeNull();
    expect(e.breakEven.kind).toBe("unreachable");
  });

  it("ROI is null when nothing is spent", () => {
    const e = estimate(
      nums({ buildCost: "0", runCost: "0", reviewMinutes: "0", rampMonths: "1" }),
    );
    expect(e.expected.totalCost36).toBe(0);
    expect(e.expected.roi36).toBeNull();
    expect(e.expected.payback).toBe(1);
  });

  it("all-zero effect does not divide by zero", () => {
    const e = estimate(
      nums({ fullSharePct: "0", assistSharePct: "0", buildCost: "0", runCost: "0" }),
    );
    expect(e.expected.fullMonthlyNet).toBe(0);
    expect(e.expected.payback).toBeNull();
    expect(e.breakEven.kind).toBe("already");
    for (const s of e.scenarios)
      for (const r of s.rows) expect(Number.isFinite(r.cumulative)).toBe(true);
  });

  it("stays finite at the largest allowed inputs", () => {
    const e = estimate(
      nums({
        tasksPerMonth: "1000000",
        minutesPerTask: "10000",
        hourlyCost: "100000",
        buildCost: "1000000000",
        runCost: "100000000",
      }),
    );
    for (const s of e.scenarios) {
      expect(Number.isFinite(s.cum36)).toBe(true);
      expect(Number.isFinite(s.annualNet)).toBe(true);
    }
  });

  it("payback is null past 36 months", () => {
    const e = estimate(nums({ buildCost: "40000" }));
    expect(e.expected.payback).toBeNull();
    expect(e.expected.cum36).toBeLessThan(0);
  });
});

describe("break-even share", () => {
  it("matches the hand calculation (about 24.06% for the golden case)", () => {
    // cum36 at 0% fully handled = -25260; at 40% = 16740; slope 1050 per point.
    const b = breakEvenFullShare(nums(), { save: 1, cost: 1 });
    expect(b.kind).toBe("needed");
    if (b.kind === "needed") expect(b.fullSharePct).toBeCloseTo(25260 / 1050, 9);
  });

  it("round-trips: at the break-even share the 36-month position is zero", () => {
    const n = nums();
    const b = breakEvenFullShare(n, { save: 1, cost: 1 });
    if (b.kind !== "needed") throw new Error("expected needed");
    const at = estimate({ ...n, fullSharePct: b.fullSharePct });
    expect(at.expected.cum36).toBeCloseTo(0, 6);
  });

  it("is 'already' when assisted savings cover costs with no full automation", () => {
    const b = breakEvenFullShare(nums({ buildCost: "0", runCost: "0" }), {
      save: 1,
      cost: 1,
    });
    expect(b.kind).toBe("already");
  });

  it("is 'never' when review costs more than a task saves", () => {
    const b = breakEvenFullShare(nums({ reviewMinutes: "20" }), { save: 1, cost: 1 });
    expect(b.kind).toBe("never");
  });

  it("is 'unreachable' when the required share exceeds what assisted tasks leave", () => {
    const b = breakEvenFullShare(nums({ assistSharePct: "70", fullSharePct: "20", buildCost: "40000" }), {
      save: 1,
      cost: 1,
    });
    expect(b.kind).toBe("unreachable");
  });
});

describe("niceScale", () => {
  it("covers the range, includes zero and uses round steps", () => {
    const s = niceScale(-27630, 32175);
    expect(s.min).toBeLessThanOrEqual(-27630);
    expect(s.max).toBeGreaterThanOrEqual(32175);
    expect(s.ticks).toContain(0);
    expect(s.step).toBe(20000);
  });
  it("handles an all-zero or tiny range and non-finite input", () => {
    expect(niceScale(0, 0).ticks.length).toBeGreaterThan(1);
    expect(niceScale(NaN, 5).ticks.length).toBeGreaterThan(1);
    expect(niceScale(-0.3, 0.7).ticks).toContain(0);
  });
});
