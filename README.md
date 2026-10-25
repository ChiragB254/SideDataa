# SideData Technologies website

Marketing site for SideData Technologies (Toronto, Ontario, Canada). Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Zod.

## Run it

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:3000
```

| Command               | What it does                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`        | ESLint (Next.js core-web-vitals + TypeScript rules)                                                                        |
| `npm run typecheck`   | `tsc --noEmit`                                                                                                             |
| `npm test`            | Vitest: Zod schemas and the API route handlers                                                                             |
| `npm run test:e2e`    | Playwright + axe-core on every route (builds and serves the site on port 3100; run `npx playwright install chromium` once) |
| `npm run build`       | Production build                                                                                                           |
| `npm run format`      | Prettier                                                                                                                   |
| `npm run cards:qr`    | Regenerate QR codes from `content/cards.ts`                                                                                |
| `npm run cards:print` | Render print-ready business card PDFs and previews to `design/cards/` (see `docs/CARDS.md`)                                |

## Structure

```
app/            routes, metadata, sitemap, robots, OG image, API route handlers
components/     layout, header/footer, form components
content/        services, careers and home-page copy as typed TypeScript data
lib/            Zod schemas, form submission handling, mail, rate limit, Turnstile
tests/          unit (Vitest) and e2e (Playwright + axe)
docs/           redesign plan, business cards (CARDS.md)
design/cards/   print-ready card PDFs and PNG previews (generated)
assets/fonts/   font files used by share images and print cards
```

Edit copy in `content/`. Colours and type live as CSS variables in `app/globals.css`.

## Forms

`/contact` and `/careers` post to `app/api/contact` and `app/api/apply`. Both validate with the same Zod schemas used in the browser, check a honeypot field, apply an in-memory rate limit (5 per 10 minutes per IP), verify Cloudflare Turnstile when `TURNSTILE_SECRET_KEY` is set, and send email through Resend when `RESEND_API_KEY` is set.

- Without `RESEND_API_KEY`: development logs the message to the server console; production returns HTTP 503 and the page tells people to email support@sidedataa.com. Message bodies are never logged in production.
- Without JavaScript, the forms submit as normal HTML posts and redirect to `/form-status`. If Turnstile is enabled (both keys set), the no-JS path cannot pass the bot check and will be rejected; only the JavaScript path works in that case.
- Turnstile needs both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. If only one is set the check is skipped and a warning is logged, so the forms are never locked by a half configuration. In production with no secret, a one-time warning is logged.
- Client IP for rate limiting (`clientIp` in `lib/submission.ts`): on the EC2 deployment it is the rightmost `X-Forwarded-For` entry (Caddy replaces any client-supplied value with the real peer address). `X-Real-IP`, `x-vercel-forwarded-for` and anything left of the last entry are client-controlled and ignored. Only when `VERCEL` is set (Vercel hosting) are `x-vercel-forwarded-for` and `x-real-ip` trusted. If no IP is found, requests share one looser bucket.
- The limiter lives in the memory of the single Node process. With one server it is enforced properly, but the counters reset on every restart or deploy, and it would not be shared across a second server. It is a brake against bursts, not a hard security control.
- A separate NestJS API is deferred until the product needs one (storing inquiries in a database, for example). The route handlers are the interim backend.

See `.env.example` for all variables.

## Build and deploy (single EC2 instance)

The site runs as a Next.js standalone build (`output: 'standalone'`) on one EC2 instance (ca-central-1, Ubuntu 24.04 arm64, Node 22): Caddy terminates TLS on 80/443 and proxies to Node on `127.0.0.1:3000`, managed by the `sidedata.service` systemd unit. Provisioning is in `infra/README.md`.

Pipeline (`.github/workflows/deploy.yml`, on push to `main` or manual run):

1. lint, typecheck and unit tests;
2. `scripts/package-release.sh` builds the site and writes `dist-release/<git-sha>.tar.gz` (standalone server with `.next/static` and `public` merged in, native modules for linux-arm64 only);
3. the tarball is uploaded to `s3://sidedata-releases-499024812515/releases/<git-sha>.tar.gz` using GitHub OIDC (repo variable `AWS_DEPLOY_ROLE_ARN`, no stored AWS keys);
4. SSM runs `scripts/activate-release.sh <git-sha>` on the instance: extract to `/opt/sidedata/releases/<sha>`, smoke test on port 3001, atomically switch `/opt/sidedata/current`, restart, check `/healthz`, and automatically restore the previous release if anything fails. The newest 5 releases are kept.

Local dry run of the packaging (needs GNU tar; macOS: `brew install gnu-tar`): `ALLOW_DIRTY=1 scripts/package-release.sh`.

`GET /healthz` returns `{"ok":true}` with `Cache-Control: no-store`; it is used by the deploy script and is safe to point an uptime monitor at.

Environment variables:

| Variable                                                               | Where it must be set                                                                        | Notes                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `TURNSTILE_SECRET_KEY` | Server: `/etc/sidedata/env`                                                                 | Runtime secrets. They never go into the repo or the tarball.                                                                      |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`               | GitHub repo **variables** (build time) and, for the Turnstile key, also `/etc/sidedata/env` | `NEXT_PUBLIC_*` is inlined into the client bundle during the build. Changing it on the server alone has no effect on the browser. |

Limits: one server means a deploy restart causes a brief (a second or two) interruption, there is no failover if the instance or the zone is down, and the rate limiter and any in-process state are per process. Add a second instance behind a load balancer if that matters later.

## Before launch

Owner decisions and content are listed in `DEPLOY.md`. Search the code for `TODO(owner)` and `NOTE(owner)`.
