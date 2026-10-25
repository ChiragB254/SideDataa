/**
 * Simple in-memory sliding-window limiter. State lives in the memory of one
 * Node process. On the single-EC2 deployment that is exactly one process, so
 * the limit is enforced for real, but it resets on every restart or deploy
 * and would NOT be shared if a second server or serverless hosting were
 * used. Put a WAF or Cloudflare rate limiting in front for more.
 */
type Bucket = number[];
const buckets = new Map<string, Bucket>();

export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;

/** Looser bucket for requests whose IP cannot be determined. */
export const SHARED_LIMIT = { max: 60, windowMs: 10 * 60 * 1000 } as const;

export function checkRateLimit(
  key: string,
  now = Date.now(),
  { max, windowMs }: { max: number; windowMs: number } = RATE_LIMIT,
): { allowed: boolean; retryAfterSeconds: number } {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    const oldest = recent[0] ?? now;
    buckets.set(key, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  recent.push(now);
  buckets.set(key, recent);
  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(): void {
  buckets.clear();
}
