/*
 * Formatting and text output for the estimator: display numbers, the plain-language
 * "how this is calculated" steps, the copy-able summary and the CSV. Pure functions.
 */
import {
  HORIZON,
  fieldGroups,
  fieldSpecs,
  rowAt,
  type BreakEven,
  type Currency,
  type Estimate,
  type FieldKey,
  type Numbers,
  type ScenarioResult,
} from "./estimator";

/** Values beyond this are shown as "more than ..." instead of an unreadable figure. */
export const DISPLAY_CAP = 1e12;

const locale = "en-CA";

export type Formatters = {
  /** 1,234 with the currency symbol or label. Capped for display. */
  money: (n: number) => string;
  /** Short form for chart axes: 12K. */
  moneyShort: (n: number) => string;
  number: (n: number, digits?: number) => string;
  hours: (n: number) => string;
  percent: (n: number, digits?: number) => string;
  /** Label used in CSV and text where a symbol could be ambiguous. */
  currencyName: string;
};

export function currencyName(c: Currency): string {
  return c.code === "OTHER" ? c.otherLabel.trim() : c.code;
}

export function makeFormatters(c: Currency): Formatters {
  const label = c.otherLabel.trim();
  const decimal = (digits: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits });
  const full =
    c.code === "OTHER"
      ? decimal(0)
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency: c.code,
          maximumFractionDigits: 0,
        });
  const short = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const prefix =
    c.code === "OTHER" ? (/^[A-Za-z]{2,}$/.test(label) ? `${label} ` : label) : "";

  const money = (n: number): string => {
    if (!Number.isFinite(n)) return "not available";
    const render = (v: number) => {
      const abs = full.format(Math.abs(v));
      const body = c.code === "OTHER" ? `${prefix}${abs}` : abs;
      return v < 0 ? `-${body}` : body;
    };
    if (n > DISPLAY_CAP) return `more than ${render(DISPLAY_CAP)}`;
    if (n < -DISPLAY_CAP) return `less than ${render(-DISPLAY_CAP)}`;
    const rounded = Math.round(n);
    return render(Object.is(rounded, -0) ? 0 : rounded);
  };
  const moneyShort = (n: number): string => {
    if (!Number.isFinite(n)) return "";
    const abs = short.format(Math.abs(n));
    const sym =
      c.code === "OTHER"
        ? prefix
        : (new Intl.NumberFormat(locale, { style: "currency", currency: c.code })
            .formatToParts(0)
            .find((p) => p.type === "currency")?.value ?? "");
    return `${n < 0 ? "-" : ""}${sym}${abs}`;
  };
  const number = (n: number, digits = 1): string =>
    Number.isFinite(n)
      ? n > DISPLAY_CAP
        ? `more than ${decimal(0).format(DISPLAY_CAP)}`
        : decimal(digits).format(Object.is(n, -0) ? 0 : n)
      : "not available";
  return {
    money,
    moneyShort,
    number,
    hours: (n) => `${number(n, 1)} ${Math.abs(n - 1) < 0.05 ? "hour" : "hours"}`,
    percent: (n, digits = 0) => `${number(n, digits)}%`,
    currencyName: currencyName(c),
  };
}

export function paybackText(payback: number | null): string {
  return payback === null ? `not within ${HORIZON} months` : `month ${payback}`;
}

export function roiText(roi: number | null, f: Formatters): string {
  if (roi === null) return "not available (no cost entered)";
  return f.percent(roi * 100, 0);
}

export function breakEvenText(b: BreakEven, f: Formatters): string {
  switch (b.kind) {
    case "already":
      return `The Expected case breaks even over ${HORIZON} months even if AI fully handles none of the tasks, because assisted tasks, growth or error savings already cover the cost.`;
    case "needed":
      return `AI would need to fully handle about ${f.percent(Math.ceil(b.fullSharePct * 10) / 10, 1)} of tasks for the Expected case to break even over ${HORIZON} months, with your other inputs unchanged.`;
    case "unreachable":
      return `With your other inputs unchanged, the Expected case does not break even over ${HORIZON} months even if AI fully handles every task not set aside as assisted.`;
    case "never":
      return `Fully handling more tasks does not help the Expected case: review time costs as much as it saves per task. Reduce review time, run cost or build cost, or look at a different workflow.`;
  }
}

/** One line, used for the polite live region. */
export function announcement(est: Estimate, f: Formatters): string {
  const e = est.expected;
  const net = e.fullMonthlyNet;
  return `Expected case: net ${net >= 0 ? "saving" : "cost"} per month ${f.money(
    Math.abs(net),
  )} at full adoption, payback ${e.payback === null ? `not within ${HORIZON} months` : `in month ${e.payback}`}.`;
}

export function invalidAnnouncement(count: number): string {
  return `Results paused: ${count} ${count === 1 ? "field needs" : "fields need"} attention.`;
}

/* ------------------------------------------------------------------ explanation */

export type Step = { title: string; formula: string; working: string };

/** The calculation in plain language, with the user's own numbers worked through. */
export function explainSteps(est: Estimate, f: Formatters): Step[] {
  const n = est.numbers;
  const b = est.base;
  const e = est.expected;
  const hr = f.money(n.hourlyCost);
  const steps: Step[] = [
    {
      title: "Time the workflow takes today",
      formula: "tasks per month x minutes per task / 60",
      working: `${f.number(n.tasksPerMonth, 0)} x ${f.number(n.minutesPerTask)} / 60 = ${f.hours(b.baselineHours)} a month, which is ${f.money(b.baselineCost)} at ${hr} an hour.`,
    },
    {
      title: "Hours saved on fully handled tasks",
      formula: "tasks x share fully handled x minutes per task / 60",
      working: `${f.number(n.tasksPerMonth, 0)} x ${f.percent(n.fullSharePct)} x ${f.number(n.minutesPerTask)} / 60 = ${f.hours((b.fullTasks * n.minutesPerTask) / 60)}.`,
    },
    {
      title: "Hours saved on assisted tasks",
      formula: "tasks x share assisted x minutes per task x time saved / 60",
      working: `${f.number(n.tasksPerMonth, 0)} x ${f.percent(n.assistSharePct)} x ${f.number(n.minutesPerTask)} x ${f.percent(n.assistSavedPct)} / 60 = ${f.hours((b.assistTasks * n.minutesPerTask * n.assistSavedPct) / 100 / 60)}.`,
    },
    {
      title: "Gross time and gross savings",
      formula: "the two lines above added together, times cost per hour",
      working: `${f.hours(b.grossHoursSaved)} x ${hr} = ${f.money(b.grossLabourSavings)} a month.`,
    },
    {
      title: "Review time (a person checks what AI handles alone)",
      formula: "fully handled tasks x review minutes / 60, times cost per hour",
      working: `${f.number(b.fullTasks, 1)} x ${f.number(n.reviewMinutes)} / 60 = ${f.hours(b.reviewHours)}, which is ${f.money(b.reviewCost)} a month. Net hours freed: ${f.hours(b.netHoursSaved)}.`,
    },
    {
      title: "Error and growth effects (only if you entered them)",
      formula:
        "(errors before - errors after) x cost per error; extra units x value x share converted",
      working: `Errors: (${f.number(n.errorsBefore, 0)} - ${f.number(n.errorsAfter, 0)}) x ${f.money(n.costPerError)} = ${f.money(b.errorSavings)}. Growth: ${f.number(n.extraUnits, 0)} x ${f.money(n.valuePerUnit)} x ${f.percent(n.realisationPct)} = ${f.money(b.growthValue)}.`,
    },
    {
      title: "Net per month at full adoption (Expected multipliers)",
      formula:
        "(gross savings + errors + growth) x savings multiplier - (review + run cost) x cost multiplier",
      working: `(${f.money(b.grossLabourSavings)} + ${f.money(b.errorSavings)} + ${f.money(b.growthValue)}) x ${f.number(e.savingsMult, 2)} - (${f.money(b.reviewCost)} + ${f.money(b.runCost)}) x ${f.number(e.costMult, 2)} = ${f.money(e.fullMonthlyNet)} a month, or ${f.money(e.annualNet)} a year.`,
    },
    {
      title: "Ramp-up",
      formula:
        "in month k, the share of the full effect is the smaller of 1 and k / months to full adoption",
      working: `With ${f.number(n.rampMonths, 0)} month${n.rampMonths === 1 ? "" : "s"} to full adoption, month 1 is ${f.percent(rowAt(e, 1).adoption * 100)} and month ${Math.min(HORIZON, Math.max(2, Math.round(n.rampMonths)))} is ${f.percent(rowAt(e, Math.min(HORIZON, Math.max(2, Math.round(n.rampMonths)))).adoption * 100)}. Run cost is charged in full from month 1.`,
    },
    {
      title: "Cumulative position against doing nothing",
      formula: "starts at minus the build cost; each month adds that month's net",
      working: `Start: ${f.money(rowAt(e, 0).cumulative)}. After 12 months: ${f.money(e.cum12)}. After 24: ${f.money(e.cum24)}. After 36: ${f.money(e.cum36)}. Doing nothing is the zero line.`,
    },
    {
      title: "Payback",
      formula: "the first month where the cumulative position reaches zero",
      working: `Expected case: ${paybackText(e.payback)}.`,
    },
    {
      title: `Simple ROI over ${HORIZON} months`,
      formula: "(total benefit - total cost) / total cost",
      working: `(${f.money(e.totalBenefit36)} - ${f.money(e.totalCost36)}) / ${f.money(e.totalCost36)} = ${roiText(e.roi36, f)}. This ignores the timing of money.`,
    },
    {
      title: "Break-even share of fully handled tasks",
      formula: `the share that makes the ${HORIZON}-month cumulative position exactly zero`,
      working: breakEvenText(est.breakEven, f),
    },
  ];
  return steps;
}

/* ------------------------------------------------------------------ summary text */

export function buildSummaryText(
  est: Estimate,
  currency: Currency,
  f: Formatters,
  dateLabel: string,
): string {
  const n = est.numbers;
  const lines: string[] = [];
  lines.push("AI savings and growth estimate (planning aid, not a forecast or a quote)");
  lines.push(`Made with the SideData Technologies estimator. ${dateLabel}`);
  lines.push(`Currency label: ${f.currencyName}. No currency conversion is done.`);
  lines.push("");
  lines.push("Inputs");
  for (const g of fieldGroups) {
    for (const k of g.keys) {
      lines.push(`- ${fieldSpecs[k].label}: ${inputText(k, n, f)}`);
    }
  }
  lines.push("");
  lines.push("Scenario multipliers (savings / costs)");
  for (const s of est.scenarios) {
    lines.push(`- ${s.name}: x${s.savingsMult} / x${s.costMult}`);
  }
  lines.push("");
  lines.push("Results (Expected case unless stated)");
  const b = est.base;
  lines.push(`- Gross time saved per month: ${f.hours(b.grossHoursSaved)}`);
  lines.push(`- Review time per month: ${f.hours(b.reviewHours)}`);
  lines.push(`- Gross savings per month: ${f.money(b.grossBenefit)}`);
  lines.push(`- Net per month at full adoption: ${f.money(est.expected.fullMonthlyNet)}`);
  lines.push(`- Net per year at full adoption: ${f.money(est.expected.annualNet)}`);
  lines.push(`- Payback: ${paybackText(est.expected.payback)}`);
  lines.push(`- ROI over ${HORIZON} months: ${roiText(est.expected.roi36, f)}`);
  lines.push(`- ${breakEvenText(est.breakEven, f)}`);
  lines.push("");
  lines.push("Cumulative net against doing nothing");
  for (const s of est.scenarios) {
    lines.push(
      `- ${s.name}: 12 months ${f.money(s.cum12)}; 24 months ${f.money(s.cum24)}; 36 months ${f.money(s.cum36)}; payback ${paybackText(s.payback)}`,
    );
  }
  lines.push("");
  lines.push(
    "Not included: data preparation, change management, security and privacy review, quality monitoring, price changes from providers, tax and inflation.",
  );
  void currency;
  return lines.join("\n");
}

function inputText(k: FieldKey, n: Numbers, f: Formatters): string {
  const spec = fieldSpecs[k];
  const v = n[k];
  if (spec.money) return `${f.money(v)} ${spec.unit}`;
  if (spec.unit.startsWith("%")) return f.percent(v, 1);
  return `${f.number(v, 2)} ${spec.unit}`;
}

/* ------------------------------------------------------------------ CSV */

/**
 * Text cells that start with = + - @ tab or CR can run as formulas in spreadsheets.
 * Prefix them with an apostrophe-free guard: a leading space is enough to stop it and
 * keeps the text readable. Numeric cells are written as numbers and never pass here.
 */
export function csvText(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? ` ${value}` : value;
  return csvCell(guarded);
}

function csvCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function num(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Math.round(n * 100) / 100);
}

/** CSV with a byte order mark so spreadsheets read it as UTF-8. Lines end in CRLF. */
export function buildCsv(est: Estimate, currency: Currency, dateLabel: string): string {
  const n = est.numbers;
  const rows: string[][] = [];
  const t = (s: string) => csvText(s);
  const row = (...cells: string[]) => rows.push(cells);
  row(t("AI savings and growth estimate"));
  row(
    t(
      "Planning aid, not a forecast, quote or guarantee. Every number comes from the inputs below.",
    ),
  );
  row(t(`Made with the SideData Technologies estimator. ${dateLabel}`));
  row(
    t(`Currency label: ${currencyName(currency)}`),
    t("No currency conversion is done."),
  );
  row();
  row(t("Inputs"), t("Value"), t("Unit"));
  for (const g of fieldGroups) {
    for (const k of g.keys) {
      row(t(fieldSpecs[k].label), num(n[k]), t(fieldSpecs[k].unit));
    }
  }
  row();
  row(t("Scenario"), t("Savings multiplier"), t("Cost multiplier"));
  for (const s of est.scenarios) row(t(s.name), num(s.savingsMult), num(s.costMult));
  row();
  row(t("Assumptions"));
  row(t("Month 0 holds the one-time build cost."));
  row(
    t(
      "Adoption grows in equal steps up to the months to full adoption, then stays at 100%.",
    ),
  );
  row(t("Run cost is charged in full from month 1. Review time scales with adoption."));
  row(
    t(
      "Savings are multiplied by the scenario savings multiplier; build, run and review costs by the cost multiplier.",
    ),
  );
  row(
    t(
      "Doing nothing is the zero line: the cumulative figures are the difference against it.",
    ),
  );
  row();
  row(t("Results"), t("Conservative"), t("Expected"), t("Optimistic"));
  const sc = est.scenarios;
  row(t("Net per month at full adoption"), ...sc.map((s) => num(s.fullMonthlyNet)));
  row(t("Net per year at full adoption"), ...sc.map((s) => num(s.annualNet)));
  row(
    t("Payback month"),
    ...sc.map((s) =>
      s.payback === null ? t(`not within ${HORIZON} months`) : String(s.payback),
    ),
  );
  row(t("Cumulative net after 12 months"), ...sc.map((s) => num(s.cum12)));
  row(t("Cumulative net after 24 months"), ...sc.map((s) => num(s.cum24)));
  row(t("Cumulative net after 36 months"), ...sc.map((s) => num(s.cum36)));
  row(
    t(`ROI over ${HORIZON} months (ratio)`),
    ...sc.map((s) => (s.roi36 === null ? "" : num(s.roi36))),
  );
  row();
  row(
    t("Month"),
    t("Adoption (%)"),
    ...sc.flatMap((s) => [t(`${s.name} net in month`), t(`${s.name} cumulative net`)]),
  );
  for (let k = 0; k <= HORIZON; k++) {
    row(
      String(k),
      num(rowAt(sc[1], k).adoption * 100),
      ...sc.flatMap((s) => [num(rowAt(s, k).net), num(rowAt(s, k).cumulative)]),
    );
  }
  return "﻿" + rows.map((r) => r.join(",")).join("\r\n") + "\r\n";
}

export function describeSeries(s: ScenarioResult, f: Formatters): string {
  return `${s.name}: ${f.money(s.cum12)} at 12 months, ${f.money(s.cum24)} at 24, ${f.money(s.cum36)} at 36; payback ${paybackText(s.payback)}.`;
}

/** The sentence under the chart that says what it shows. */
export function chartSummary(est: Estimate, f: Formatters): string {
  const lines = est.scenarios.map((s) => describeSeries(s, f)).join(" ");
  return `Cumulative net position over ${HORIZON} months, compared with doing nothing (zero). Each line starts at minus the build cost in month 0. ${lines}`;
}
