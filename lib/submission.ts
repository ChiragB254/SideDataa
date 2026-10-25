import type { ZodType } from "zod";
import { fieldErrors } from "./schemas";
import { checkRateLimit, SHARED_LIMIT } from "./rate-limit";
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
        | "bad_request";
      message: string;
      errors?: Record<string, string>;
    };

/** Default cap for text-only forms (contact). The apply route passes its own. */
const DEFAULT_MAX_BODY_BYTES = 40_000;

/** Uploads being read at once. Bounds memory on top of the per-IP rate limit. */
const MAX_CONCURRENT_UPLOADS = 6;
let uploadsInFlight = 0;

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
  bad_request: "The request could not be read.",
} as const;

const statusFor = {
  invalid: 400,
  bad_request: 400,
  too_large: 413,
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

function respond(request: Request, kind: FormKind, result: ApiResult): Response {
  if (wantsJson(request)) {
    if (result.ok) return Response.json(result, { status: 200 });
    const headers: HeadersInit =
      result.code === "rate_limited" ? { "Retry-After": "600" } : {};
    return Response.json(result, { status: statusFor[result.code], headers });
  }
  // Plain HTML form post (no JavaScript): redirect to a status page.
  const status = result.ok
    ? "sent"
    : result.code === "invalid" && result.errors?.resume
      ? "invalid_resume"
      : result.code;
  const url = new URL(`/form-status?form=${kind}&result=${status}`, request.url);
  return Response.redirect(url, 303);
}

type UploadedFile = { name: string; bytes: Uint8Array };
type ParsedBody = {
  fields: Record<string, unknown>;
  files: Record<string, UploadedFile>;
};

/**
 * Read at most `max` bytes. Returns "too_large" when the declared length is
 * over the cap (or missing, if `requireLength`) or when the stream exceeds it.
 * The stream cap does not trust Content-Length.
 */
async function readBytes(
  request: Request,
  max: number,
  requireLength: boolean,
): Promise<Uint8Array | "too_large"> {
  const header = request.headers.get("content-length");
  if (requireLength && (header === null || !/^\d+$/.test(header))) return "too_large";
  if (Number(header ?? 0) > max) return "too_large";
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return "too_large";
    }
    chunks.push(value);
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
  // Unknown IP: share one looser bucket so unattributable traffic cannot lock
  // the whole site after five submissions, but is still capped.
  const limit = ip
    ? checkRateLimit(`${kind}:${ip}`)
    : checkRateLimit(`${kind}:shared`, Date.now(), SHARED_LIMIT);
  if (!limit.allowed) return fail("rate_limited");

  if (upload && uploadsInFlight >= MAX_CONCURRENT_UPLOADS) return fail("rate_limited");
  if (upload) uploadsInFlight++;
  let read: Uint8Array | "too_large";
  let body: ParsedBody | null = null;
  try {
    read = await readBytes(request, maxBody, upload);
    if (read !== "too_large") {
      body = await parseBody(read, request.headers.get("content-type") ?? "");
    }
  } finally {
    if (upload) uploadsInFlight--;
  }
  if (read === "too_large") {
    return upload
      ? fail("too_large", { resume: resumeMessages.tooLarge })
      : fail("bad_request");
  }
  if (!body) return fail("bad_request");

  // Honeypot: real people never see or fill this field. Pretend it worked.
  if (typeof body.fields.website === "string" && body.fields.website.trim() !== "") {
    return respond(request, kind, { ok: true });
  }

  const parsed = schema.safeParse(body.fields);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);
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

  const result = await sendMail(toMail(parsed.data, resume));
  if (result === "unavailable") return fail("unavailable");
  if (result === "failed") return fail("failed");
  return respond(request, kind, { ok: true });
}

/** Strip line breaks so user input cannot inject extra headers or subjects. */
export function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
