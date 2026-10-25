export const dynamic = "force-dynamic";

/** Liveness probe for the deploy script, Caddy and uptime checks. No secrets, no I/O. */
export function GET(): Response {
  return Response.json(
    { ok: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
