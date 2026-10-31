/*
 * AI savings and growth estimator: the model.
 *
 * Pure functions only (no React, no DOM, no network, no storage), so the maths can be
 * unit-tested and reviewed on its own. This is a planning calculator. It turns the
 * numbers a person types in into arithmetic; it does not predict results, and none of
 * the default values are statistics. Every default is an example value.
 *
 * Conventions
 *  - Money is in one currency the user chooses by label. No conversion happens anywhere.
 *  - A "task" is one unit of the workflow (an invoice, a ticket, a quote request...).
 *  - Month 0 is the day the build cost is paid. Months 1..HORIZON are the months after.
 *  - Adoption ramps linearly: in month k the share of the full effect is min(1, k / ramp).
 *  - Run cost is charged in full from month 1 (tools and hosting are paid for before
 *    everyone uses them). Review time scales with adoption because it scales with volume.
 */

export const HORIZON = 36;

/**
 * Payback counts as reached when the running total is within half a cent of zero or
 * above. Month-by-month floating-point sums can land at -0.000000000003 when the true
 * answer is exactly zero.
 */
export const PAYBACK_TOLERANCE = -0.005;

export type FieldKey =
  | "tasksPerMonth"
  | "minutesPerTask"
  | "hourlyCost"
  | "fullSharePct"
  | "assistSharePct"
  | "assistSavedPct"
  | "reviewMinutes"
  | "buildCost"
  | "runCost"
  | "rampMonths"
  | "extraUnits"
  | "valuePerUnit"
  | "realisationPct"
  | "errorsBefore"
  | "errorsAfter"
  | "costPerError"
  | "consSave"
  | "consCost"
  | "expSave"
  | "expCost"
  | "optSave"
  | "optCost";

export type FieldSpec = {
  key: FieldKey;
  label: string;
  /** Short unit text shown beside the input, e.g. "%", "minutes", "per month". */
  unit: string;
  /** "money" fields show the chosen currency label beside their unit. */
  money?: boolean;
  min: number;
  max: number;
  integer?: boolean;
  /** Optional fields may be left empty and count as 0. */
  optional?: boolean;
  /** Example value as text. Every one is an example, not a statistic. */
  example: string;
  hint: string;
};

function multiplierSpec(key: FieldKey, label: string, example: string): FieldSpec {
  return {
    key,
    label,
    unit: "times",
    min: 0,
    max: 10,
    example,
    hint: key.endsWith("Save")
      ? "Multiplies the savings and growth you entered."
      : "Multiplies build cost, run cost and review time.",
  };
}

export const fieldSpecs: Record<FieldKey, FieldSpec> = {
  tasksPerMonth: {
    key: "tasksPerMonth",
    label: "Tasks per month",
    unit: "tasks",
    min: 1,
    max: 1_000_000,
    integer: true,
    example: "400",
    hint: "How many times the workflow runs each month, for example invoices processed or tickets answered.",
  },
  minutesPerTask: {
    key: "minutesPerTask",
    label: "Minutes per task today",
    unit: "minutes",
    min: 0.1,
    max: 10_000,
    example: "12",
    hint: "Average hands-on time for one task now. Time a few real ones rather than guessing.",
  },
  hourlyCost: {
    key: "hourlyCost",
    label: "Fully loaded cost per person-hour",
    unit: "per hour",
    money: true,
    min: 0.01,
    max: 100_000,
    example: "45",
    hint: "Wages plus payroll costs, benefits, equipment and overhead, divided by hours worked.",
  },
  fullSharePct: {
    key: "fullSharePct",
    label: "Tasks AI can fully handle",
    unit: "% of tasks",
    min: 0,
    max: 100,
    example: "25",
    hint: "Share of tasks the AI finishes without a person doing the work. A person still checks the output (see review time).",
  },
  assistSharePct: {
    key: "assistSharePct",
    label: "Tasks where AI assists",
    unit: "% of tasks",
    min: 0,
    max: 100,
    example: "30",
    hint: "Share of tasks where AI drafts or prepares and a person finishes. Together with the field above, this cannot pass 100%.",
  },
  assistSavedPct: {
    key: "assistSavedPct",
    label: "Time saved on assisted tasks",
    unit: "% of task time",
    min: 0,
    max: 100,
    example: "30",
    hint: "How much shorter an assisted task becomes. Includes the person checking the AI's work on those tasks.",
  },
  reviewMinutes: {
    key: "reviewMinutes",
    label: "Review time per fully handled task",
    unit: "minutes",
    min: 0,
    max: 10_000,
    example: "2",
    hint: "Human-in-the-loop time to check each task the AI handles on its own. Use 0 only if no one will check.",
  },
  buildCost: {
    key: "buildCost",
    label: "One-time build and integration cost",
    unit: "one-time",
    money: true,
    min: 0,
    max: 1_000_000_000,
    example: "15000",
    hint: "Design, development, connecting your systems, testing and training. Use a real quote if you have one.",
  },
  runCost: {
    key: "runCost",
    label: "Monthly run cost",
    unit: "per month",
    money: true,
    min: 0,
    max: 100_000_000,
    example: "600",
    hint: "AI usage, hosting, tooling and maintenance. Enter your own figure from current provider pricing; prices change.",
  },
  rampMonths: {
    key: "rampMonths",
    label: "Months to reach full adoption",
    unit: "months",
    min: 1,
    max: 24,
    integer: true,
    example: "3",
    hint: "The effect grows in equal steps until this month. Use 1 if everyone switches on day one.",
  },
  extraUnits: {
    key: "extraUnits",
    label: "Extra work the freed time could absorb",
    unit: "units per month",
    min: 0,
    max: 1_000_000,
    optional: true,
    example: "0",
    hint: "Optional. Extra jobs, leads or orders per month the freed capacity could take on. Leave 0 to ignore growth.",
  },
  valuePerUnit: {
    key: "valuePerUnit",
    label: "Value per extra unit",
    unit: "per unit",
    money: true,
    min: 0,
    max: 100_000_000,
    optional: true,
    example: "0",
    hint: "Optional. Margin you would keep on one extra job or converted lead, not revenue.",
  },
  realisationPct: {
    key: "realisationPct",
    label: "Share of extra capacity actually converted",
    unit: "%",
    min: 0,
    max: 100,
    optional: true,
    example: "25",
    hint: "Optional. Spare time does not turn into sales on its own. Be cautious here.",
  },
  errorsBefore: {
    key: "errorsBefore",
    label: "Errors per month today",
    unit: "errors",
    min: 0,
    max: 1_000_000,
    optional: true,
    example: "0",
    hint: "Optional. Mistakes or rework per month in the current process.",
  },
  errorsAfter: {
    key: "errorsAfter",
    label: "Errors per month with AI",
    unit: "errors",
    min: 0,
    max: 1_000_000,
    optional: true,
    example: "0",
    hint: "Optional. Your expectation after the change. AI can also introduce errors, so test this before you rely on it.",
  },
  costPerError: {
    key: "costPerError",
    label: "Cost of one error",
    unit: "per error",
    money: true,
    min: 0,
    max: 100_000_000,
    optional: true,
    example: "0",
    hint: "Optional. Rework time, refunds, credits or lost customers, per error.",
  },
  consSave: multiplierSpec("consSave", "Conservative: savings multiplier", "0.5"),
  consCost: multiplierSpec("consCost", "Conservative: cost multiplier", "1.3"),
  expSave: multiplierSpec("expSave", "As entered: savings multiplier", "1"),
  expCost: multiplierSpec("expCost", "As entered: cost multiplier", "1"),
  optSave: multiplierSpec("optSave", "Optimistic: savings multiplier", "1.25"),
  optCost: multiplierSpec("optCost", "Optimistic: cost multiplier", "1"),
};

export type ScenarioId = "conservative" | "expected" | "optimistic";

export const fieldGroups: {
  id: string;
  legend: string;
  note?: string;
  keys: FieldKey[];
}[] = [
  {
    id: "workflow",
    legend: "The workflow today",
    keys: ["tasksPerMonth", "minutesPerTask", "hourlyCost"],
  },
  {
    id: "ai",
    legend: "What AI would do",
    keys: ["fullSharePct", "assistSharePct", "assistSavedPct", "reviewMinutes"],
  },
  {
    id: "costs",
    legend: "Costs and timing",
    keys: ["buildCost", "runCost", "rampMonths"],
  },
  {
    id: "growth",
    legend: "Growth (optional)",
    note: "Leave these at 0 to count cost savings only.",
    keys: ["extraUnits", "valuePerUnit", "realisationPct"],
  },
  {
    id: "errors",
    legend: "Errors and rework (optional)",
    note: "Leave these at 0 to ignore error costs.",
    keys: ["errorsBefore", "errorsAfter", "costPerError"],
  },
];

export const scenarioFieldKeys: {
  id: ScenarioId;
  name: string;
  save: FieldKey;
  cost: FieldKey;
}[] = [
  { id: "conservative", name: "Conservative", save: "consSave", cost: "consCost" },
  { id: "expected", name: "As entered", save: "expSave", cost: "expCost" },
  { id: "optimistic", name: "Optimistic", save: "optSave", cost: "optCost" },
];

export type FieldValues = Record<FieldKey, string>;

export const defaultValues: FieldValues = Object.fromEntries(
  (Object.keys(fieldSpecs) as FieldKey[]).map((k) => [k, fieldSpecs[k].example]),
) as FieldValues;

export const currencies = [
  { code: "CAD", name: "Canadian dollar (CAD)" },
  { code: "USD", name: "US dollar (USD)" },
  { code: "INR", name: "Indian rupee (INR)" },
  { code: "EUR", name: "Euro (EUR)" },
  { code: "GBP", name: "Pound sterling (GBP)" },
  { code: "OTHER", name: "Other (type a label)" },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

export type Currency = { code: CurrencyCode; otherLabel: string };

export const OTHER_LABEL_MAX = 6;

/* ------------------------------------------------------------------ validation */

const plainNumber = /^(\d+\.?\d*|\.\d+)$/;
const groupedNumber = /^\d{1,3}(,\d{3})+(\.\d+)?$/;

/** Parse what a person typed. Accepts 1250, 1250.5, .5, 5. and 1,250.50. Returns NaN otherwise. */
export function parseNumber(text: string): number {
  const t = text.trim().replace(/\s+/g, "");
  if (plainNumber.test(t) || groupedNumber.test(t)) {
    const n = Number(t.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

export type Numbers = Record<FieldKey, number>;

export type ValidationResult =
  | { ok: true; numbers: Numbers; errors: Partial<Record<FieldKey, string>> }
  | { ok: false; numbers: null; errors: Partial<Record<FieldKey, string>> };

function fmtLimit(n: number): string {
  return new Intl.NumberFormat("en-CA", { maximumFractionDigits: 6 }).format(n);
}

export function validateField(spec: FieldSpec, raw: string): string | null {
  const text = raw.trim();
  if (text === "") {
    return spec.optional ? null : `Enter a number for "${spec.label}".`;
  }
  const n = parseNumber(text);
  if (Number.isNaN(n)) {
    return `"${spec.label}" must be a number such as 1250 or 1250.50. Use digits and a decimal point only.`;
  }
  if (spec.integer && !Number.isInteger(n)) {
    return `"${spec.label}" must be a whole number.`;
  }
  if (n < spec.min) {
    return `"${spec.label}" must be at least ${fmtLimit(spec.min)}.`;
  }
  if (n > spec.max) {
    return `"${spec.label}" must be at most ${fmtLimit(spec.max)}.`;
  }
  return null;
}

export function validateInputs(values: FieldValues): ValidationResult {
  const errors: Partial<Record<FieldKey, string>> = {};
  const numbers = {} as Numbers;
  for (const key of Object.keys(fieldSpecs) as FieldKey[]) {
    const spec = fieldSpecs[key];
    const err = validateField(spec, values[key] ?? "");
    if (err) errors[key] = err;
    const text = (values[key] ?? "").trim();
    numbers[key] = text === "" ? 0 : parseNumber(text);
  }
  if (
    !errors.fullSharePct &&
    !errors.assistSharePct &&
    numbers.fullSharePct + numbers.assistSharePct > 100
  ) {
    errors.assistSharePct = `"${fieldSpecs.assistSharePct.label}" plus "${fieldSpecs.fullSharePct.label}" cannot be more than 100%. Right now they add up to ${fmtLimit(
      numbers.fullSharePct + numbers.assistSharePct,
    )}%.`;
  }
  if (Object.keys(errors).length > 0) return { ok: false, numbers: null, errors };
  return { ok: true, numbers, errors };
}

export function validateCurrency(c: Currency): string | null {
  if (c.code !== "OTHER") return null;
  const label = c.otherLabel.trim();
  if (label === "") return "Type a currency symbol or label, for example R or AED.";
  if (label.length > OTHER_LABEL_MAX)
    return `Use ${OTHER_LABEL_MAX} characters or fewer for the currency label.`;
  return null;
}

/* ------------------------------------------------------------------ the model */

export type Base = {
  /** Hours per month the workflow takes today. */
  baselineHours: number;
  baselineCost: number;
  fullTasks: number;
  assistTasks: number;
  /** Hours saved per month at full adoption, before review time. */
  grossHoursSaved: number;
  reviewHours: number;
  netHoursSaved: number;
  /** grossHoursSaved x hourly cost. */
  grossLabourSavings: number;
  /** reviewHours x hourly cost. */
  reviewCost: number;
  /** (errors before - errors after) x cost per error. Negative when errors rise. */
  errorSavings: number;
  /** Cost of extra errors per month (the negative part of errorSavings, as a positive number). */
  errorExtraCost: number;
  growthValue: number;
  /**
   * Positive benefits only: labour savings + error savings (if positive) + growth value.
   * The savings multiplier applies to this. Extra-error cost is a cost, so it is
   * handled with review and run cost and scaled by the cost multiplier instead.
   */
  grossBenefit: number;
  runCost: number;
  buildCost: number;
  /** Net per month at full adoption with multipliers of 1. */
  monthlyNet: number;
};

export function computeBase(n: Numbers): Base {
  const baselineHours = (n.tasksPerMonth * n.minutesPerTask) / 60;
  const fullTasks = (n.tasksPerMonth * n.fullSharePct) / 100;
  const assistTasks = (n.tasksPerMonth * n.assistSharePct) / 100;
  const grossHoursSaved =
    (fullTasks * n.minutesPerTask +
      (assistTasks * n.minutesPerTask * n.assistSavedPct) / 100) /
    60;
  const reviewHours = (fullTasks * n.reviewMinutes) / 60;
  const grossLabourSavings = grossHoursSaved * n.hourlyCost;
  const reviewCost = reviewHours * n.hourlyCost;
  const errorSavings = (n.errorsBefore - n.errorsAfter) * n.costPerError;
  const growthValue = (n.extraUnits * n.valuePerUnit * n.realisationPct) / 100;
  const errorExtraCost = Math.max(0, -errorSavings);
  const grossBenefit = grossLabourSavings + Math.max(0, errorSavings) + growthValue;
  return {
    baselineHours,
    baselineCost: baselineHours * n.hourlyCost,
    fullTasks,
    assistTasks,
    grossHoursSaved,
    reviewHours,
    netHoursSaved: grossHoursSaved - reviewHours,
    grossLabourSavings,
    reviewCost,
    errorSavings,
    errorExtraCost,
    growthValue,
    grossBenefit,
    runCost: n.runCost,
    buildCost: n.buildCost,
    monthlyNet: grossBenefit - reviewCost - errorExtraCost - n.runCost,
  };
}

/** Row for a month; the model always builds months 0..HORIZON, so a miss is a bug. */
export function rowAt(s: { rows: MonthRow[] }, month: number): MonthRow {
  const r = s.rows[month];
  if (!r) throw new RangeError(`No row for month ${month}`);
  return r;
}

export function adoptionAt(month: number, rampMonths: number): number {
  const ramp = Math.max(1, rampMonths);
  return Math.min(1, Math.max(0, month / ramp));
}

export type MonthRow = {
  month: number;
  adoption: number;
  benefit: number;
  reviewCost: number;
  errorCost: number;
  runCost: number;
  net: number;
  cumulative: number;
};

export type ScenarioResult = {
  id: ScenarioId;
  name: string;
  savingsMult: number;
  costMult: number;
  /** Index 0 is month 0 (build cost only); 1..HORIZON follow. */
  rows: MonthRow[];
  /** Net per month at full adoption, with this scenario's multipliers. */
  fullMonthlyNet: number;
  annualNet: number;
  /** Month number of payback, or null when it does not happen within HORIZON months. */
  payback: number | null;
  cum12: number;
  cum24: number;
  cum36: number;
  totalBenefit36: number;
  totalCost36: number;
  /** (benefit - cost) / cost over 36 months, or null when there is no cost. */
  roi36: number | null;
  /** True when this scenario has no benefit and no cost at all (nothing to compare). */
  noEffect: boolean;
};

export function computeScenario(
  n: Numbers,
  base: Base,
  id: ScenarioId,
  name: string,
  savingsMult: number,
  costMult: number,
): ScenarioResult {
  const build = base.buildCost * costMult;
  const rows: MonthRow[] = [
    {
      month: 0,
      adoption: 0,
      benefit: 0,
      reviewCost: 0,
      errorCost: 0,
      runCost: 0,
      net: -build,
      cumulative: -build,
    },
  ];
  let cumulative = -build;
  let totalBenefit = 0;
  let totalCost = build;
  for (let k = 1; k <= HORIZON; k++) {
    const adoption = adoptionAt(k, n.rampMonths);
    const benefit = adoption * base.grossBenefit * savingsMult;
    const review = adoption * base.reviewCost * costMult;
    const errorCost = adoption * base.errorExtraCost * costMult;
    const run = base.runCost * costMult;
    const net = benefit - review - errorCost - run;
    cumulative += net;
    totalBenefit += benefit;
    totalCost += review + errorCost + run;
    rows.push({
      month: k,
      adoption,
      benefit,
      reviewCost: review,
      errorCost,
      runCost: run,
      net,
      cumulative,
    });
  }
  const fullMonthlyNet =
    base.grossBenefit * savingsMult -
    base.errorExtraCost * costMult -
    base.reviewCost * costMult -
    base.runCost * costMult;
  let payback: number | null = null;
  if (fullMonthlyNet > 0) {
    for (let k = 1; k <= HORIZON; k++) {
      if (rowAt({ rows }, k).cumulative >= PAYBACK_TOLERANCE) {
        payback = k;
        break;
      }
    }
  }
  return {
    id,
    name,
    savingsMult,
    costMult,
    rows,
    fullMonthlyNet,
    annualNet: fullMonthlyNet * 12,
    payback,
    cum12: rowAt({ rows }, 12).cumulative,
    cum24: rowAt({ rows }, 24).cumulative,
    cum36: rowAt({ rows }, 36).cumulative,
    totalBenefit36: totalBenefit,
    totalCost36: totalCost,
    roi36: totalCost > 0 ? (totalBenefit - totalCost) / totalCost : null,
    noEffect: totalBenefit === 0 && totalCost === 0,
  };
}

export type BreakEven =
  /** Nothing entered has any benefit or cost, so there is nothing to compare. */
  | { kind: "nothing" }
  /** The savings multiplier is 0, so no share of fully handled tasks can cover the costs. */
  | { kind: "no-savings" }
  /** Break-even without any fully handled tasks, and the current share is no worse. */
  | { kind: "already" }
  /** Break-even without fully handled tasks, but the current share ends below zero. */
  | { kind: "fewer" }
  | { kind: "needed"; fullSharePct: number }
  /** Even handling every task that is not set aside for assist does not break even. */
  | { kind: "unreachable" }
  /** More fully handled tasks make things worse (review cost per task exceeds the saving). */
  | { kind: "never" };

/**
 * Share of tasks AI must fully handle for the As-entered case to break even over 36
 * months, holding every other input fixed. The 36-month cumulative is a straight line
 * in that share, so two evaluations are enough.
 */
export function breakEvenFullShare(
  n: Numbers,
  asEntered: { save: number; cost: number },
): BreakEven {
  const run = (pct: number) => {
    const nn = { ...n, fullSharePct: pct };
    return computeScenario(
      nn,
      computeBase(nn),
      "expected",
      "As entered",
      asEntered.save,
      asEntered.cost,
    );
  };
  const now = run(n.fullSharePct);
  if (now.noEffect) return { kind: "nothing" };
  const c0 = run(0).cum36;
  if (c0 >= PAYBACK_TOLERANCE) {
    return now.cum36 < PAYBACK_TOLERANCE ? { kind: "fewer" } : { kind: "already" };
  }
  if (asEntered.save === 0) return { kind: "no-savings" };
  const slope = (run(100).cum36 - c0) / 100;
  if (!(slope > 0)) return { kind: "never" };
  const pct = -c0 / slope;
  if (pct > 100 - n.assistSharePct + 1e-9) return { kind: "unreachable" };
  return { kind: "needed", fullSharePct: pct };
}

export type Estimate = {
  numbers: Numbers;
  base: Base;
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
  expected: ScenarioResult;
  breakEven: BreakEven;
};

export function estimate(n: Numbers): Estimate {
  const base = computeBase(n);
  const scenarios = scenarioFieldKeys.map((s) =>
    computeScenario(n, base, s.id, s.name, n[s.save], n[s.cost]),
  ) as Estimate["scenarios"];
  return {
    numbers: n,
    base,
    scenarios,
    expected: scenarios[1],
    breakEven: breakEvenFullShare(n, { save: n.expSave, cost: n.expCost }),
  };
}

/* ------------------------------------------------------------------ chart helpers */

/** Round tick values covering [lo, hi] and always including 0. */
export function niceScale(
  lo: number,
  hi: number,
  targetTicks = 5,
): { min: number; max: number; step: number; ticks: number[] } {
  let a = Math.min(lo, 0);
  let b = Math.max(hi, 0);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    a = 0;
    b = 1;
  }
  if (a === b) b = a + 1;
  const raw = (b - a) / Math.max(1, targetTicks);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const stepBase = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  const step = stepBase * pow;
  const min = Math.floor(a / step) * step;
  const max = Math.ceil(b / step) * step;
  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) {
    ticks.push(Math.abs(v) < step / 1e6 ? 0 : v);
  }
  return { min, max, step, ticks };
}
