import type { ZodType } from "zod";
import { fieldErrors } from "./schemas";
import {
  checkRateLimit,
  peekRateLimit,
  recordRateLimit,
  SHARED_LIMIT,
} from "./rate-limit";
import { verifyTurnstile } from "./turnstile";
import { sendMail, type OutgoingMail } from "./mail";
import {
  APPLY_MAX_BODY_BYTES,
  resumeMessages,
  validateResume,
  type ResumeCheck,
} from "./resume";

export type FormKind = "contact" | "apply";

export type ApiResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "invalid"
        | "rate_limited"
        | "bot_check"
        | "unavailable"
        | "failed"
        | "too_large"
        | "busy"
        | "timeout"
        | "bad_request";
      message: string;
      errors?: Record<string, string>;
    };

/** Default cap for text-only forms (contact). The apply route passes its own. */
const DEFAULT_MAX_BODY_BYTES = 40_000;

/**
 * Uploads being handled at once (reading, validating, sending): 6 in total and
 * 1 per IP. A slot is held until the email has been handed to the provider.
 */
export const MAX_CONCURRENT_UPLOADS = 6;
const uploadsByIp = new Map<string, number>();
let uploadsInFlight = 0;

/** Hard total time to receive a request body. */
export const BODY_DEADLINE_MS = 45_000;

/**
 * Apply route budgets per IP per 10 minutes. Every accepted-for-reading
 * attempt counts toward ATTEMPTS (so rejected files cost something), but only
 * successful sends count toward SENDS, so successes stay capped at 5.
 */
const APPLY_ATTEMPTS = { max: 10, windowMs: 10 * 60 * 1000 } as const;
const APPLY_SENDS = { max: 5, windowMs: 10 * 60 * 1000 } as const;

/** Test helper. */
export function resetUploadState(): void {
  uploadsByIp.clear();
  uploadsInFlight = 0;
}

function acquireUploadSlot(ip: string | null): boolean {
  if (uploadsInFlight >= MAX_CONCURRENT_UPLOADS) return false;
  if (ip && (uploadsByIp.get(ip) ?? 0) >= 1) return false;
  uploadsInFlight++;
  if (ip) uploadsByIp.set(ip, (uploadsByIp.get(ip) ?? 0) + 1);
  return true;
}

function releaseUploadSlot(ip: string | null): void {
  uploadsInFlight = Math.max(0, uploadsInFlight - 1);
  if (ip) {
    const n = (uploadsByIp.get(ip) ?? 1) - 1;
    if (n <= 0) uploadsByIp.delete(ip);
    else uploadsByIp.set(ip, n);
  }
}

const messages = {
  invalid: "Some fields need attention. Check the highlighted fields and try again.",
  rate_limited:
    "Too many submissions from your connection. Please wait a few minutes and try again.",
  bot_check: "The spam check did not pass. Reload the page and try again.",
  unavailable:
    "This form is not accepting messages right now. Please email support@sidedataa.com instead.",
  failed:
    "We could not send your message. Please try again, or email support@sidedataa.com.",
  too_large: "The file is too large. The limit is 5 MB.",
  busy: "Please try again in a minute.",
  timeout: "The upload took too long. Check your connection and try again.",
  bad_request: "The request could not be read.",
} as const;

const statusFor = {
  invalid: 400,
  bad_request: 400,
  too_large: 413,
  busy: 429,
  timeout: 408,
  bot_check: 403,
  rate_limited: 429,
  unavailable: 503,
  failed: 502,
} as const;

/**
 * Best-effort client IP.
 *
 * On Vercel (process.env.VERCEL is set) the platform strips and sets
 * x-vercel-forwarded-for, so that header and x-real-ip are trusted, then the
 * rightmost x-forwarded-for entry.
 *
 * Everywhere else (the EC2 deployment: Caddy on 80/443 proxying to Node on
 * 127.0.0.1:3000) only the RIGHTMOST x-forwarded-for entry is used. Caddy
 * REPLACES any client-supplied X-Forwarded-For with the address of the peer
 * it actually saw (it only keeps incoming values from configured trusted
 * proxies, and there are none), so that value is the real client. The
 * rightmost rule is kept as defence in depth. Any x-real-ip or
 * x-vercel-forwarded-for header can be forged by the client and is ignored.
 * This is only safe because Node is bound to 127.0.0.1 and reachable solely
 * through Caddy.
 *
 * Returns null when nothing usable is present.
 */
export function clientIp(headers: Headers): string | null {
  const clean = (v: string | null | undefined) => {
    const t = v?.trim();
    return t && t.length <= 64 ? t : null;
  };
  if (process.env.VERCEL) {
    const vercel = clean(headers.get("x-vercel-forwarded-for")?.split(",")[0]);
    if (vercel) return vercel;
    const real = clean(headers.get("x-real-ip"));
    if (real) return real;
  }
  const fwd = headers.get("x-forwarded-for")?.split(",");
  return clean(fwd?.[fwd.length - 1]);
}

function wantsJson(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return type.includes("application/json") || accept.includes("application/json");
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients and some same-origin form posts
  try {
    return (
      new URL(origin).host === (request.headers.get("host") ?? new URL(request.url).host)
    );
  } catch {
    return false;
  }
}

const NO_STORE = { "Cache-Control": "no-store" } as const;

function respond(request: Request, kind: FormKind, result: ApiResult): Response {
  if (wantsJson(request)) {
    if (result.ok) return Response.json(result, { status: 200, headers: NO_STORE });
    const headers: Record<string, string> = { ...NO_STORE };
    if (result.code === "rate_limited") headers["Retry-After"] = "600";
    if (result.code === "busy") headers["Retry-After"] = "60";
    return Response.json(result, { status: statusFor[result.code], headers });
  }
  // Plain HTML form post (no JavaScript): redirect to a status page. The
  // Location is relative so it stays correct behind a reverse proxy (the
  // request URL there is the internal 127.0.0.1 address).
  const status = result.ok
    ? "sent"
    : result.code === "invalid" && result.errors?.resume
      ? "invalid_resume"
      : result.code;
  return new Response(null, {
    status: 303,
    headers: { Location: `/form-status?form=${kind}&result=${status}`, ...NO_STORE },
  });
}

type UploadedFile = { name: string; bytes: Uint8Array };
type ParsedBody = {
  fields: Record<string, unknown>;
  files: Record<string, UploadedFile>;
};

/**
 * Read at most `max` bytes, within BODY_DEADLINE_MS in total. Returns
 * "too_large" when the declared length is over the cap (or missing, if
 * `requireLength`) or when the stream exceeds it, and "timeout" when the
 * deadline passes first. The stream cap does not trust Content-Length.
 */
async function readBytes(
  request: Request,
  max: number,
  requireLength: boolean,
): Promise<Uint8Array | "too_large" | "timeout"> {
  const header = request.headers.get("content-length");
  if (requireLength && (header === null || !/^\d+$/.test(header))) return "too_large";
  if (Number(header ?? 0) > max) return "too_large";
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    reader.cancel().catch(() => {});
  }, BODY_DEADLINE_MS);
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (timedOut) return "timeout";
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel().catch(() => {});
        return "too_large";
      }
      chunks.push(value);
    }
  } catch {
    return timedOut ? "timeout" : "too_large";
  } finally {
    clearTimeout(timer);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function parseBody(bytes: Uint8Array, type: string): Promise<ParsedBody | null> {
  try {
    const replay = new Response(bytes as BodyInit, { headers: { "content-type": type } });
    if (type.includes("application/json")) {
      const json: unknown = await replay.json();
      return json && typeof json === "object" && !Array.isArray(json)
        ? { fields: json as Record<string, unknown>, files: {} }
        : null;
    }
    if (
      type.includes("application/x-www-form-urlencoded") ||
      type.includes("multipart/form-data")
    ) {
      const form = await replay.formData();
      const fields: Record<string, unknown> = {};
      const files: Record<string, UploadedFile> = {};
      for (const [k, v] of form.entries()) {
        if (typeof v === "string") fields[k] = v;
        else files[k] = { name: v.name, bytes: new Uint8Array(await v.arrayBuffer()) };
      }
      return { fields, files };
    }
  } catch {
    return null;
  }
  return null;
}

export async function handleSubmission<
  T extends {
    website?: string | undefined;
    "cf-turnstile-response"?: string | undefined;
  },
>(
  request: Request,
  opts: {
    kind: FormKind;
    schema: ZodType<T>;
    toMail: (data: T, resume?: Extract<ResumeCheck, { ok: true }>) => OutgoingMail;
    /** Per-route body cap in bytes. Default 40 KB. */
    maxBodyBytes?: number;
    /** Require and validate an uploaded "resume" file. Needs a Content-Length. */
    resume?: boolean;
  },
): Promise<Response> {
  const { kind, schema, toMail } = opts;
  const upload = opts.resume === true;
  const maxBody =
    opts.maxBodyBytes ?? (upload ? APPLY_MAX_BODY_BYTES : DEFAULT_MAX_BODY_BYTES);
  const fail = (
    code: Exclude<ApiResult, { ok: true }>["code"],
    errors?: Record<string, string>,
  ) =>
    respond(request, kind, {
      ok: false,
      code,
      message: messages[code],
      ...(errors ? { errors } : {}),
    });

  if (!sameOrigin(request)) return fail("bad_request");

  const ip = clientIp(request.headers);

  async function process(): Promise<Response> {
    // Unknown IP: share one looser bucket so unattributable traffic cannot lock
    // the whole site, but is still capped.
    const bucket = ip ?? "shared";
    if (upload) {
      const sends = ip ? APPLY_SENDS : SHARED_LIMIT;
      const attempts = ip ? APPLY_ATTEMPTS : SHARED_LIMIT;
      if (!peekRateLimit(`${kind}-ok:${bucket}`, Date.now(), sends)) {
        return fail("rate_limited");
      }
      if (!checkRateLimit(`${kind}:${bucket}`, Date.now(), attempts).allowed) {
        return fail("rate_limited");
      }
    } else if (
      !checkRateLimit(`${kind}:${bucket}`, Date.now(), ip ? undefined : SHARED_LIMIT)
        .allowed
    ) {
      return fail("rate_limited");
    }

    let read = await readBytes(request, maxBody, upload);
    if (read === "timeout") return fail("timeout");
    if (read === "too_large") {
      return upload
        ? fail("too_large", { resume: resumeMessages.tooLarge })
        : fail("bad_request");
    }
    let body: ParsedBody | null = await parseBody(
      read,
      request.headers.get("content-type") ?? "",
    );
    read = new Uint8Array();
    if (!body) return fail("bad_request");

    // Honeypot: real people never see or fill this field. Pretend it worked.
    if (typeof body.fields.website === "string" && body.fields.website.trim() !== "") {
      return respond(request, kind, { ok: true });
    }

    const parsed = schema.safeParse(body.fields);
    const errors: Record<string, string> = parsed.success
      ? {}
      : fieldErrors(parsed.error);
    let resume: Extract<ResumeCheck, { ok: true }> | undefined;
    if (upload) {
      const check = validateResume(body.files.resume);
      if (check.ok) resume = check;
      else errors.resume = check.message;
    }
    // File and field errors are reported before any email or bot-check work.
    if (!parsed.success || Object.keys(errors).length > 0) return fail("invalid", errors);

    const bot = await verifyTurnstile(parsed.data["cf-turnstile-response"], ip);
    if (bot === "failed") return fail("bot_check");

    // Build the email, then drop every other reference to the file bytes so
    // only the base64 copy inside `mail` stays alive while it is sent.
    const mail = toMail(parsed.data, resume);
    body = null;
    resume = undefined;

    const result = await sendMail(mail);
    if (result === "unavailable") return fail("unavailable");
    if (result === "failed") return fail("failed");
    if (upload) recordRateLimit(`${kind}-ok:${bucket}`);
    return respond(request, kind, { ok: true });
  }

  if (!upload) return process();
  // One upload per IP and six in total. A busy answer does not cost any budget.
  if (!acquireUploadSlot(ip)) return fail("busy");
  try {
    return await process();
  } finally {
    releaseUploadSlot(ip);
  }
}

/** Remove control characters (keeping \n and \t if asked) and bidi controls. */
const BIDI = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const CONTROLS_ALL = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROLS_KEEP_NEWLINES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** Plain-text, multi-line user input: no control or bidi characters. */
export function cleanText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROLS_KEEP_NEWLINES, "")
    .replace(BIDI, "");
}

/** Wrap an applicant message so it is clearly separate from our own text. */
export function wrapMessage(label: string, message: string): string {
  return [
    `--- ${label} (unverified; do not trust links) ---`,
    cleanText(message),
    "--- End of message ---",
  ].join("\n");
}

/** Strip line breaks so user input cannot inject extra headers or subjects. */
export function oneLine(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(CONTROLS_ALL, "")
    .replace(BIDI, "")
    .trim();
}
