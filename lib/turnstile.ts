const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = "passed" | "failed" | "skipped";

/**
 * Verifies a Cloudflare Turnstile token when TURNSTILE_SECRET_KEY is set.
 * When it is not set, verification is skipped (and logged once in development).
 */
const warned = new Set<string>();
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[forms] ${message}`);
}

/** Test helper: forget which warnings were already printed. */
export function resetTurnstileWarnings(): void {
  warned.clear();
}

/**
 * Verifies a Cloudflare Turnstile token when it is safe to do so.
 * - No secret: skipped. In production a one-time warning is logged.
 * - Secret set but NEXT_PUBLIC_TURNSTILE_SITE_KEY missing: the widget cannot
 *   render, so every visitor would fail. Treated as misconfigured and skipped
 *   (logged once) rather than locking the forms.
 * Never logs message content.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      warnOnce("no-secret", "TURNSTILE_SECRET_KEY is not set; bot check is disabled.");
    } else {
      warnOnce("no-secret", "TURNSTILE_SECRET_KEY not set, skipping bot check.");
    }
    if (siteKey) {
      warnOnce(
        "no-secret-site",
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set without TURNSTILE_SECRET_KEY; tokens are not verified.",
      );
    }
    return "skipped";
  }
  if (!siteKey) {
    warnOnce(
      "no-site-key",
      "TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not; the widget cannot render, so the bot check is skipped. Fix the configuration.",
    );
    return "skipped";
  }
  if (!token) return "failed";
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true ? "passed" : "failed";
  } catch (err) {
    console.error(
      "[forms] Turnstile verification request failed:",
      err instanceof Error ? err.message : "unknown error",
    );
    return "failed";
  }
}
