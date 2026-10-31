"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  HORIZON,
  OTHER_LABEL_MAX,
  currencies,
  defaultValues,
  estimate,
  fieldGroups,
  fieldSpecs,
  scenarioFieldKeys,
  validateCurrency,
  validateInputs,
  type Currency,
  type Estimate,
  type CurrencyCode,
  type FieldKey,
  type FieldSpec,
  type FieldValues,
} from "@/lib/estimator";
import {
  announcement,
  breakEvenText,
  buildCsv,
  buildSummaryText,
  explainSteps,
  invalidAnnouncement,
  makeFormatters,
  paybackText,
  roiText,
  type Formatters,
} from "@/lib/estimator-format";
import { CumulativeChart, CumulativeTable } from "./CumulativeChart";

/*
 * Everything here runs in the browser and nothing leaves it: no fetch, no storage, no
 * URL changes, no analytics. Inputs live in component state only, so a refresh clears them.
 */

const defaultCurrency: Currency = { code: "CAD", otherLabel: "" };
const idFor = (k: string) => `est-${k}`;

function NumberField({
  spec,
  value,
  error,
  currencyLabel,
  onChange,
  onBlur,
}: {
  spec: FieldSpec;
  value: string;
  error: string | null;
  currencyLabel: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = idFor(spec.key);
  const isExample = value === spec.example;
  const unit = spec.money ? `${currencyLabel} ${spec.unit}` : spec.unit;
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {spec.label}
      </label>
      <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
        {spec.hint}
        {isExample ? " Example value: replace with yours." : ""}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <input
          id={id}
          name={spec.key}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
          aria-invalid={error ? true : undefined}
          className="field-control !w-40 max-w-full"
        />
        <span className="text-sm text-ink-soft">{unit}</span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          <span aria-hidden="true">Error: </span>
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-t border-rule py-3 first:border-t-0 first:pt-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-serif text-2xl leading-tight [overflow-wrap:anywhere]">
        {value}
      </dd>
      {note ? <dd className="mt-0.5 text-sm text-ink-soft">{note}</dd> : null}
    </div>
  );
}

export function EstimatorTool() {
  const uid = useId();
  const [values, setValues] = useState<FieldValues>(defaultValues);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [interacted, setInteracted] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [status, setStatus] = useState("");
  const [fallbackText, setFallbackText] = useState("");

  const validation = useMemo(() => validateInputs(values), [values]);
  const currencyError = validateCurrency(currency);
  const f = useMemo(() => makeFormatters(currency), [currency]);
  const ready = validation.ok && !currencyError;
  const est = useMemo(
    () => (validation.ok && !currencyError ? estimate(validation.numbers) : null),
    [validation, currencyError],
  );

  const errorList = useMemo(() => {
    const out: { id: string; message: string }[] = [];
    if (currencyError && touched["currency"])
      out.push({ id: "est-currency-label", message: currencyError });
    for (const key of Object.keys(validation.errors) as FieldKey[]) {
      if (touched[key]) out.push({ id: idFor(key), message: validation.errors[key]! });
    }
    return out;
  }, [validation, currencyError, touched]);

  const totalProblems = Object.keys(validation.errors).length + (currencyError ? 1 : 0);

  // One settled, polite announcement about 600 ms after the last change.
  const liveText = est ? announcement(est, f) : invalidAnnouncement(totalProblems);
  useEffect(() => {
    if (!interacted) return;
    const t = setTimeout(() => setAnnounce(liveText), 600);
    return () => clearTimeout(t);
  }, [liveText, interacted]);

  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const edit = (k: FieldKey, v: string) => {
    setInteracted(true);
    setStatus("");
    setFallbackText("");
    setValues((prev) => ({ ...prev, [k]: v }));
  };

  const reset = () => {
    setValues(defaultValues);
    setCurrency(defaultCurrency);
    setTouched({});
    setFallbackText("");
    setInteracted(true);
    setStatus("Reset to the example values.");
  };

  const today = () =>
    `Made on ${new Date().toLocaleDateString("en-CA", { dateStyle: "long" })}.`;

  const copy = async () => {
    if (!est) return;
    const text = buildSummaryText(est, currency, f, today());
    try {
      await navigator.clipboard.writeText(text);
      setFallbackText("");
      setStatus("Summary copied to the clipboard.");
    } catch {
      setFallbackText(text);
      setStatus(
        "Could not copy automatically. The summary is shown below to copy by hand.",
      );
    }
  };

  const download = () => {
    if (!est) return;
    const csv = buildCsv(est, currency, today());
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-savings-estimate.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setStatus("CSV file ai-savings-estimate.csv prepared. Check your downloads.");
  };

  const focusField = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.focus();
  };

  const currencyLabel = f.currencyName;
  const e = est?.expected;

  return (
    <div>
      <p
        aria-live="polite"
        aria-atomic="true"
        data-testid="live-summary"
        className="sr-only"
      >
        {announce}
      </p>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        <form
          aria-label="Estimator inputs"
          noValidate
          onSubmit={(ev) => ev.preventDefault()}
          className="min-w-0 lg:col-span-7"
        >
          <p className="border border-rule bg-wash px-4 py-3 text-[0.9375rem] text-ink-soft">
            Every starting value is an example. Replace each one with your own figures.
            Everything is calculated in your browser. Nothing you enter is sent anywhere,
            saved, or put in the web address, and a refresh clears it.
          </p>

          {errorList.length > 0 ? (
            <div
              data-testid="error-summary"
              className="mt-6 border-2 border-danger bg-white p-4"
              aria-labelledby={`${uid}-errors`}
              role="group"
            >
              <h2 id={`${uid}-errors`} className="font-serif text-xl">
                {errorList.length === 1
                  ? "1 field needs attention"
                  : `${errorList.length} fields need attention`}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-danger">
                {errorList.map((er) => (
                  <li key={er.id}>
                    <a
                      href={`#${er.id}`}
                      onClick={focusField(er.id)}
                      className="underline"
                    >
                      {er.message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <fieldset className="mt-8 min-w-0">
            <legend className="mb-1 w-full border-t border-rule pt-5 font-serif text-xl">
              Currency
            </legend>
            <p className="mt-1 text-sm text-muted">
              This only sets the label shown on amounts. No currency conversion happens.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="est-currency" className="block font-medium">
                  Currency label
                </label>
                <select
                  id="est-currency"
                  className="field-control mt-1.5 !w-72 max-w-full"
                  value={currency.code}
                  onChange={(ev) => {
                    setInteracted(true);
                    setStatus("");
                    setCurrency((c) => ({ ...c, code: ev.target.value as CurrencyCode }));
                  }}
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {currency.code === "OTHER" ? (
                <div>
                  <label htmlFor="est-currency-label" className="block font-medium">
                    Currency symbol or label
                  </label>
                  <p id="est-currency-label-hint" className="mt-0.5 text-sm text-muted">
                    For example R or AED. Up to {OTHER_LABEL_MAX} characters.
                  </p>
                  <input
                    id="est-currency-label"
                    type="text"
                    autoComplete="off"
                    maxLength={OTHER_LABEL_MAX + 4}
                    value={currency.otherLabel}
                    onChange={(ev) => {
                      setInteracted(true);
                      setCurrency((c) => ({ ...c, otherLabel: ev.target.value }));
                    }}
                    onBlur={() => touch("currency")}
                    aria-describedby={
                      currencyError && touched["currency"]
                        ? "est-currency-label-hint est-currency-label-error"
                        : "est-currency-label-hint"
                    }
                    aria-invalid={currencyError && touched["currency"] ? true : undefined}
                    className="field-control mt-1.5 !w-40 max-w-full"
                  />
                  {currencyError && touched["currency"] ? (
                    <p
                      id="est-currency-label-error"
                      className="mt-1.5 text-sm font-medium text-danger"
                    >
                      <span aria-hidden="true">Error: </span>
                      <span className="sr-only">Error: </span>
                      {currencyError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </fieldset>

          {fieldGroups.map((g) => (
            <fieldset key={g.id} className="mt-8 min-w-0">
              <legend className="mb-1 w-full border-t border-rule pt-5 font-serif text-xl">
                {g.legend}
              </legend>
              {g.note ? <p className="mt-1 text-sm text-muted">{g.note}</p> : null}
              <div className="mt-4 space-y-6">
                {g.keys.map((k) => (
                  <NumberField
                    key={k}
                    spec={fieldSpecs[k]}
                    value={values[k]}
                    error={touched[k] ? (validation.errors[k] ?? null) : null}
                    currencyLabel={currencyLabel || "…"}
                    onChange={(v) => edit(k, v)}
                    onBlur={() => touch(k)}
                  />
                ))}
              </div>
            </fieldset>
          ))}

          <fieldset className="mt-8 min-w-0">
            <legend className="mb-1 w-full border-t border-rule pt-5 font-serif text-xl">
              Scenario multipliers
            </legend>
            <p className="mt-1 text-sm text-muted">
              The three cases are your numbers scaled up or down. Savings and growth are
              multiplied by the savings multiplier. Build cost, run cost and review time
              are multiplied by the cost multiplier. These are starting points for
              thinking, not measured ranges. Change them to match how cautious you want to
              be.
            </p>
            <div className="mt-4 space-y-8">
              {scenarioFieldKeys.map((s) => (
                <div key={s.id} className="grid gap-6 sm:grid-cols-2">
                  {[s.save, s.cost].map((k) => (
                    <NumberField
                      key={k}
                      spec={fieldSpecs[k]}
                      value={values[k]}
                      error={touched[k] ? (validation.errors[k] ?? null) : null}
                      currencyLabel={currencyLabel || "…"}
                      onChange={(v) => edit(k, v)}
                      onBlur={() => touch(k)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </fieldset>
        </form>

        <aside
          aria-labelledby={`${uid}-headline`}
          className="est-sticky min-w-0 self-start lg:col-span-5"
        >
          <div className="border border-ink bg-white p-5">
            <h2 id={`${uid}-headline`} className="font-serif text-2xl">
              Expected case
            </h2>
            {e && est ? (
              <dl className="mt-4">
                <Metric
                  label={`Net ${e.fullMonthlyNet >= 0 ? "saving" : "cost"} per month at full adoption`}
                  value={f.money(Math.abs(e.fullMonthlyNet))}
                  note={`After run cost (${f.money(est.base.runCost)}) and review time (${f.money(est.base.reviewCost)}).`}
                />
                <Metric label="Payback" value={paybackText(e.payback)} />
                <Metric
                  label={`Cumulative net after ${HORIZON} months, against doing nothing`}
                  value={f.money(e.cum36)}
                />
                <Metric
                  label={`Simple ROI over ${HORIZON} months`}
                  value={roiText(e.roi36, f)}
                />
              </dl>
            ) : (
              <p className="mt-4 text-ink-soft">
                Results are paused until every field holds a valid number. Fix the fields
                marked above, or reset to the example values.
              </p>
            )}
            <p className="mt-4 border-t border-rule pt-3 text-sm text-ink-soft">
              A planning estimate built from the numbers you entered. It is not a
              forecast, a quote or a guarantee of any saving.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row xl:flex-wrap">
              <button type="button" className="btn btn-quiet" onClick={reset}>
                Reset to example values
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={copy}
                disabled={!ready}
              >
                Copy summary
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={download}
                disabled={!ready}
              >
                Download CSV
              </button>
            </div>
            <p
              role="status"
              data-testid="action-status"
              className="mt-3 min-h-6 text-sm text-ink-soft"
            >
              {status}
            </p>
            {fallbackText ? (
              <div className="mt-2">
                <label htmlFor="est-fallback" className="block text-sm font-medium">
                  Summary to copy
                </label>
                <textarea
                  id="est-fallback"
                  readOnly
                  rows={8}
                  value={fallbackText}
                  className="field-control mt-1 font-mono text-xs"
                />
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {est && e ? <Results est={est} f={f} /> : null}
    </div>
  );
}

function Results({ est, f }: { est: Estimate; f: Formatters }) {
  const b = est.base;
  const rows: { label: string; value: string }[] = [
    {
      label: "Hours the workflow takes today, per month",
      value: f.hours(b.baselineHours),
    },
    { label: "Its cost today, per month", value: f.money(b.baselineCost) },
    { label: "Gross time saved, per month", value: f.hours(b.grossHoursSaved) },
    {
      label: "Review time on AI-handled tasks, per month",
      value: f.hours(b.reviewHours),
    },
    { label: "Net hours freed, per month", value: f.hours(b.netHoursSaved) },
    { label: "Gross savings from time, per month", value: f.money(b.grossLabourSavings) },
    { label: "Error savings, per month", value: f.money(b.errorSavings) },
    { label: "Growth value, per month", value: f.money(b.growthValue) },
    { label: "Review cost, per month", value: f.money(b.reviewCost) },
    { label: "Run cost, per month", value: f.money(b.runCost) },
    { label: "Net at full adoption, per month", value: f.money(b.monthlyNet) },
  ];
  const steps = explainSteps(est, f);
  const caption =
    "Scenario results: net per month at full adoption, payback, cumulative net and ROI for the Conservative, Expected and Optimistic cases.";
  const metricRows: [string, (s: Estimate["scenarios"][number]) => string][] = [
    ["Savings multiplier", (s) => `x${s.savingsMult}`],
    ["Cost multiplier", (s) => `x${s.costMult}`],
    ["Net per month, full adoption", (s) => f.money(s.fullMonthlyNet)],
    ["Net per year, full adoption", (s) => f.money(s.annualNet)],
    ["Payback", (s) => paybackText(s.payback)],
    ["Cumulative net, 12 months", (s) => f.money(s.cum12)],
    ["Cumulative net, 24 months", (s) => f.money(s.cum24)],
    ["Cumulative net, 36 months", (s) => f.money(s.cum36)],
    [`ROI over ${HORIZON} months`, (s) => roiText(s.roi36, f)],
  ];
  return (
    <div className="mt-16 space-y-16">
      <section aria-labelledby="est-monthly-title">
        <h2 id="est-monthly-title" className="text-3xl leading-tight">
          Month by month at full adoption
        </h2>
        <p className="measure mt-3 text-ink-soft">
          Gross figures are before review time and run cost. Net is after both. These use
          your own inputs with multipliers of 1.
        </p>
        <dl className="mt-6 max-w-2xl border-b border-rule">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid gap-x-6 border-t border-rule py-2.5 sm:grid-cols-[1fr_auto]"
            >
              <dt className="text-ink-soft">{r.label}</dt>
              <dd className="font-medium [overflow-wrap:anywhere] sm:text-right">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="est-scen-title">
        <h2 id="est-scen-title" className="text-3xl leading-tight">
          Three cases side by side
        </h2>
        <p className="measure mt-3 text-ink-soft">
          Conservative, Expected and Optimistic use the multipliers shown in the table.
          You can edit them in the form. Each case is a way to test how sensitive the
          answer is, not a prediction.
        </p>
        <div className="mt-6 hidden sm:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-y border-ink">
                <td className="py-2 pr-2" />
                {est.scenarios.map((s) => (
                  <th key={s.id} scope="col" className="px-3 py-2 text-right font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map(([label, fn]) => (
                <tr key={label} className="border-b border-rule align-top">
                  <th scope="row" className="py-2 pr-2 font-normal text-ink-soft">
                    {label}
                  </th>
                  {est.scenarios.map((s) => (
                    <td
                      key={s.id}
                      className="px-3 py-2 text-right [overflow-wrap:anywhere] tabular-nums"
                    >
                      {fn(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-8 sm:hidden">
          {est.scenarios.map((s) => (
            <div key={s.id}>
              <h3 className="border-b border-ink pb-1 font-serif text-xl">{s.name}</h3>
              <dl>
                {metricRows.map(([label, fn]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-rule py-2"
                  >
                    <dt className="text-ink-soft">{label}</dt>
                    <dd className="text-right [overflow-wrap:anywhere] tabular-nums">
                      {fn(s)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="measure mt-6 text-ink-soft" data-testid="break-even">
          <strong className="font-medium text-ink">Break-even.</strong>{" "}
          {breakEvenText(est.breakEven, f)}
        </p>
      </section>

      <section aria-labelledby="est-chart-title">
        <h2 id="est-chart-title" className="text-3xl leading-tight">
          The {HORIZON}-month view against doing nothing
        </h2>
        <div className="mt-4">
          <CumulativeChart est={est} f={f} />
          <CumulativeTable est={est} f={f} />
        </div>
      </section>

      <section aria-labelledby="est-how-title">
        <h2 id="est-how-title" className="text-3xl leading-tight">
          How this is calculated
        </h2>
        <p className="measure mt-3 text-ink-soft">
          Each step shows the rule in words and then works it through with the numbers
          currently in the form. They are your inputs, not typical figures.
        </p>
        <ol className="mt-6 max-w-3xl space-y-5">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-x-2">
              <span className="font-serif text-xl text-muted" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="font-serif text-lg leading-snug">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">Rule: {s.formula}</p>
                <p className="mt-1 [overflow-wrap:anywhere]">{s.working}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
