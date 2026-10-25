"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import Script from "next/script";
import type { ZodType } from "zod";
import { fieldErrors, type FieldErrors } from "@/lib/schemas";

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "url" | "select" | "textarea";
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  options?: readonly { value: string; label: string }[];
  placeholderOption?: string;
  rows?: number;
};

type Status = "idle" | "submitting" | "sent" | "error";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function FormEngine({
  kind,
  endpoint,
  schema,
  fields,
  submitLabel,
  note,
  successTitle,
  successBody,
}: {
  kind: "contact" | "apply";
  endpoint: string;
  schema: ZodType;
  fields: FieldConfig[];
  submitLabel: string;
  note?: string;
  successTitle: string;
  successBody: string;
}) {
  const uid = useId();
  // false during server render and hydration, true afterwards: lets us turn on
  // custom validation only when JavaScript is running.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  const errorKeys = fields.filter((f) => errors[f.name]).map((f) => f.name);
  const idOf = (name: string) => `${uid}-${name}`;

  useEffect(() => {
    if (errorKeys.length > 0) summaryRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  function renderTurnstile() {
    if (
      siteKey &&
      turnstileRef.current &&
      window.turnstile &&
      !turnstileRef.current.hasChildNodes()
    ) {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
      });
    }
  }

  // A Turnstile token is single use: get a fresh one after any failed attempt.
  function resetTurnstile() {
    if (siteKey && window.turnstile) window.turnstile.reset(widgetId.current);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data: Record<string, string> = {};
    new FormData(form).forEach((v, k) => {
      if (typeof v === "string") data[k] = v;
    });

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setStatus("idle");
      setServerMessage("");
      return;
    }
    setErrors({});
    setServerMessage("");
    setStatus("submitting");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; message?: string; errors?: Record<string, string> }
        | null;
      if (res.ok && json?.ok) {
        setStatus("sent");
        return;
      }
      if (json && !json.ok && json.errors) setErrors(json.errors);
      setServerMessage(
        (json && !json.ok && json.message) ||
          "We could not send your message. Please try again, or email support@sidedataa.com.",
      );
      setStatus("error");
      resetTurnstile();
    } catch {
      setServerMessage(
        "We could not reach the server. Check your connection and try again, or email support@sidedataa.com.",
      );
      setStatus("error");
      resetTurnstile();
    }
  }

  if (status === "sent") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border border-accent bg-white p-6 outline-none"
      >
        <h3 className="text-2xl">{successTitle}</h3>
        <p className="mt-2 text-ink-soft">{successBody}</p>
      </div>
    );
  }

  return (
    <form
      action={endpoint}
      method="post"
      noValidate={hydrated}
      onSubmit={onSubmit}
      aria-label={kind === "contact" ? "Contact form" : "Application form"}
      className="space-y-6"
    >
      {errorKeys.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="border-2 border-danger bg-white p-4 outline-none"
        >
          <h3
            id={`${uid}-summary`}
            className="!font-sans text-lg !font-semibold text-danger"
          >
            There{" "}
            {errorKeys.length === 1 ? "is 1 problem" : `are ${errorKeys.length} problems`}{" "}
            with your submission
          </h3>
          <ul className="mt-2 list-disc pl-5">
            {fields
              .filter((f) => errors[f.name])
              .map((f) => (
                <li key={f.name}>
                  <a className="link" href={`#${idOf(f.name)}`}>
                    {f.label}: {errors[f.name]}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}

      {fields.map((f) => {
        const id = idOf(f.name);
        const err = errors[f.name];
        const describedBy =
          [f.hint ? `${id}-hint` : "", err ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined;
        const common = {
          id,
          name: f.name,
          className: "field-control",
          required: f.required,
          "aria-required": f.required ? (true as const) : undefined,
          "aria-invalid": err ? (true as const) : undefined,
          "aria-describedby": describedBy,
          autoComplete: f.autoComplete,
        };
        return (
          <div key={f.name}>
            <label htmlFor={id} className="mb-1.5 block font-medium">
              {f.label}
              {f.required ? (
                <span className="font-normal text-muted"> (required)</span>
              ) : (
                <span className="font-normal text-muted"> (optional)</span>
              )}
            </label>
            {f.hint && (
              <p id={`${id}-hint`} className="mb-1.5 text-sm text-muted">
                {f.hint}
              </p>
            )}
            {f.type === "select" ? (
              <select {...common} defaultValue="">
                <option value="">{f.placeholderOption ?? "Choose one"}</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea {...common} rows={f.rows ?? 6} />
            ) : (
              <input {...common} type={f.type} />
            )}
            {err && (
              <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
                <span className="sr-only">Error: </span>
                {err}
              </p>
            )}
          </div>
        );
      })}

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {siteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={renderTurnstile}
          />
          <div ref={turnstileRef} />
        </>
      )}

      {status === "error" && serverMessage && (
        <p
          role="alert"
          className="border-l-4 border-danger bg-white p-4 font-medium text-danger"
        >
          {serverMessage}
        </p>
      )}

      {note ? <p className="text-ink-soft">{note}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : submitLabel}
        </button>
        <span role="status" className="text-sm text-muted">
          {status === "submitting" ? "Sending your message" : ""}
        </span>
      </div>
    </form>
  );
}
