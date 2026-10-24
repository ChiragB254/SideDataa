# SideData Technologies website

Marketing site for SideData Technologies (Toronto, Ontario, Canada). Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Zod.

## Run it

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:3000
```

| Command             | What it does                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript rules)                                                                        |
| `npm run typecheck` | `tsc --noEmit`                                                                                                             |
| `npm test`          | Vitest: Zod schemas and the API route handlers                                                                             |
| `npm run test:e2e`  | Playwright + axe-core on every route (builds and serves the site on port 3100; run `npx playwright install chromium` once) |
| `npm run build`     | Production build                                                                                                           |
| `npm run format`    | Prettier                                                                                                                   |

## Structure

```
app/            routes, metadata, sitemap, robots, OG image, API route handlers
components/     layout, header/footer, form components
content/        services, careers and home-page copy as typed TypeScript data
lib/            Zod schemas, form submission handling, mail, rate limit, Turnstile
tests/          unit (Vitest) and e2e (Playwright + axe)
docs/           redesign plan
```

Edit copy in `content/`. Colours and type live as CSS variables in `app/globals.css`.

## Forms

`/contact` and `/careers` post to `app/api/contact` and `app/api/apply`. Both validate with the same Zod schemas used in the browser, check a honeypot field, apply an in-memory rate limit (5 per 10 minutes per IP, best effort on serverless), verify Cloudflare Turnstile when `TURNSTILE_SECRET_KEY` is set, and send email through Resend when `RESEND_API_KEY` is set.

- Without `RESEND_API_KEY`: development logs the message to the server console; production returns HTTP 503 and the page tells people to email support@sidedataa.com. Message bodies are never logged in production.
- Without JavaScript, the forms submit as normal HTML posts and redirect to `/form-status`. If Turnstile is enabled (both keys set), the no-JS path cannot pass the bot check and will be rejected; only the JavaScript path works in that case.
- Turnstile needs both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. If only one is set the check is skipped and a warning is logged, so the forms are never locked by a half configuration. In production with no secret, a one-time warning is logged.
- Client IP for rate limiting comes from `x-vercel-forwarded-for`, `x-real-ip`, or the rightmost `x-forwarded-for` entry. If none exists, requests share one looser bucket.
- A separate NestJS API is deferred until the product needs one (storing inquiries in a database, for example). The route handlers are the interim backend.

See `.env.example` for all variables.

## Before launch

Owner decisions and content are listed in `DEPLOY.md`. Search the code for `TODO(owner)` and `NOTE(owner)`.
