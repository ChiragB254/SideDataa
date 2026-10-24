import type { ZodType } from "zod";
import { fieldErrors } from "./schemas";
import { checkRateLimit, SHARED_LIMIT } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";
import { sendMail, type OutgoingMail } from "./mail";

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
        | "bad_request";
      message: string;
      errors?: Record<string, string>;
    };

const MAX_BODY_BYTES = 40_000;

const messages = {
  invalid: "Some fields need attention. Check the highlighted fields and try again.",
  rate_limited:
    "Too many submissions from your connection. Please wait a few minutes and try again.",
  bot_check: "The spam check did not pass. Reload the page and try again.",
  unavailable:
    "This form is not accepting messages right now. Please email support@sidedataa.com instead.",
  failed:
    "We could not send your message. Please try again, or email support@sidedataa.com.",
  bad_request: "The request could not be read.",
} as const;

const statusFor = {
  invalid: 400,
  bad_request: 400,
  bot_check: 403,
  rate_limited: 429,
  unavailable: 503,
  failed: 502,
} as const;

/**
 * Best-effort client IP. Order: x-vercel-forwarded-for (set by the platform),
 * x-real-ip, then the RIGHTMOST x-forwarded-for entry (the one added by the
 * proxy closest to us; leftmost entries are client-controlled). Returns null
 * when nothing usable is present.
 */
export function clientIp(headers: Headers): string | null {
  const clean = (v: string | null | undefined) => {
    const t = v?.trim();
    return t && t.length <= 64 ? t : null;
  };
  const vercel = clean(headers.get("x-vercel-forwarded-for")?.split(",")[0]);
  if (vercel) return vercel;
  const real = clean(headers.get("x-real-ip"));
  if (real) return real;
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
  const status = result.ok ? "sent" : result.code;
  const url = new URL(`/form-status?form=${kind}&result=${status}`, request.url);
  return Response.redirect(url, 303);
}

/** Read at most MAX_BODY_BYTES; returns null if the body is larger. */
async function readBytes(request: Request): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
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

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    const bytes = await readBytes(request);
    if (!bytes) return null;
    const replay = new Response(bytes as BodyInit, { headers: { "content-type": type } });
    if (type.includes("application/json")) {
      const json: unknown = await replay.json();
      return json && typeof json === "object" && !Array.isArray(json)
        ? (json as Record<string, unknown>)
        : null;
    }
    if (
      type.includes("application/x-www-form-urlencoded") ||
      type.includes("multipart/form-data")
    ) {
      const form = await replay.formData();
      const out: Record<string, unknown> = {};
      for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
      return out;
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
  opts: { kind: FormKind; schema: ZodType<T>; toMail: (data: T) => OutgoingMail },
): Promise<Response> {
  const { kind, schema, toMail } = opts;
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

  const body = await readBody(request);
  if (!body) return fail("bad_request");

  // Honeypot: real people never see or fill this field. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return respond(request, kind, { ok: true });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("invalid", fieldErrors(parsed.error));

  const bot = await verifyTurnstile(parsed.data["cf-turnstile-response"], ip);
  if (bot === "failed") return fail("bot_check");

  const result = await sendMail(toMail(parsed.data));
  if (result === "unavailable") return fail("unavailable");
  if (result === "failed") return fail("failed");
  return respond(request, kind, { ok: true });
}

/** Strip line breaks so user input cannot inject extra headers or subjects. */
export function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
