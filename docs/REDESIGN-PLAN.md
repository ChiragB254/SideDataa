# SideData Technologies website: redesign plan

Architecture diagram: `.archify/architecture-sidedata-site-20261024-120000/sidedata-site.html`

## 1. Goals

1. Look like a real, human-built IT company, not a template or an AI demo.
2. Be the proof of legitimacy that clients and the students you recruit check first. The students do not build it; you do.
3. Be accessible (WCAG 2.2 AA) and fast.
4. Stay easy for one owner to maintain: clear structure, content separate from code.

## 2. What is wrong with the current site

| Problem | Why it hurts |
|---|---|
| Dark theme, violet/pink/blue gradients, glass cards, marquee, animated counters | This is the "AI-generated" look you want to avoid |
| Everything in one 748-line `App.jsx`, state-based "pages", no real URLs | Not shareable, not indexable, not maintainable |
| Invented testimonials (named people at named companies), "100% client retention", "25+ projects" | Fake proof damages trust the moment anyone checks. **Remove all of it.** Use only real, approved claims |
| Emoji favicon, no social/SEO metadata, no a11y work | Reads as unfinished |
| `DEPLOY.md` says the domain is `sidedataa.com` | Confirm the real domain before launch |

## 3. Scope: services to present

AI solutions, web and software development, server management, rack and data-centre build-outs, cloud, and general IT services. The old site also listed cybersecurity and data analytics; keep them only if you actually offer them.

## 4. Technology (versions checked on npm on 2026-10-24)

| Layer | Choice | Why |
|---|---|---|
| Web | **Next.js 16** (App Router), **React 19**, **TypeScript** | Static pre-rendering, real routes, metadata/SEO built in, widely supported |
| Styling | **Tailwind CSS 4** with design tokens as CSS variables | Fast to build, one source for colour and type |
| Content | **MDX files in Git** (services, case studies, blog, careers) | Content writers edit text through pull requests, no CMS cost. A headless CMS can be added later |
| API | **NestJS** (TypeScript) in `apps/api` | Clear structure, and it can host a future product |
| Validation | **Zod**, shared between web and API | One schema, both sides |
| Database | **PostgreSQL** (managed) with **Drizzle ORM** | Stores inquiries and career applications |
| Email and bots | **Resend** for notifications, **Cloudflare Turnstile** for bot checks | Privacy-friendlier than reCAPTCHA |
| Edge | **Cloudflare** DNS, CDN, WAF | Free tier is enough, and fits a company that sells IT/security |
| Hosting | Web on **Vercel**, API and Postgres on a managed host (Fly.io, Railway or Neon). Final pick is a decision for you | Cheap to start, no servers to babysit at launch |
| Quality | ESLint, Prettier, Vitest, **Playwright + axe-core**, Lighthouse CI, GitHub Actions | Accessibility and performance are checked on every PR |

Repo layout: pnpm workspaces with Turborepo.

```
apps/web        Next.js site
apps/api        NestJS API
packages/ui     shared components and design tokens
packages/schemas  shared Zod schemas
content/        MDX: services, work, blog, careers
docs/           this plan and decision records
```

Why a backend at all: contact and career forms need validated, stored, spam-protected submissions. The API is small at launch.

## 5. Design direction

- **Light, calm, editorial.** Warm off-white background (`#FAF9F6`), near-black ink (`#1B1F23`), one muted accent (deep slate-teal, about `#2F5D62`) and one neutral grey scale. No purple, no gradients, no glow.
- **Type:** one serif for headings (for example Source Serif 4) plus one sans for body (for example Inter or IBM Plex Sans), self-hosted. Large, plain headlines, left-aligned.
- **Layout:** generous whitespace, 12-column grid, real photography or simple line diagrams of your own work in place of stock icons. Sparse motion: fades under 200ms, all disabled under `prefers-reduced-motion`.
- **Tone of copy:** specific and plain. Say what you build, for whom, and how an engagement works. No "revolutionary", "cutting-edge", "synergy".
- **Accessibility rules:** contrast 4.5:1 for text, visible focus rings, skip link, semantic landmarks, keyboard-only navigation, labelled form fields with inline errors, alt text, no information carried by colour alone, 44px touch targets. Light theme first; dark theme optional later.

## 6. Site map

| Route | Purpose |
|---|---|
| `/` | One-sentence positioning, six service summaries, how we work, a real project or two, contact call-to-action |
| `/services` and `/services/[slug]` | AI, web and software, servers and managed IT, racks and data-centre, cloud, IT support |
| `/work` and `/work/[slug]` | Case studies. Start with your own projects, add client work as it exists |
| `/about` | Who runs the company, mission, how the team works |
| `/careers` and `/careers/[role]` | Roles for web dev, content, UI/UX and graphics, with an application form. This is the page recruits read most closely |
| `/insights` | Blog by the content team (SEO and credibility) |
| `/contact` | Inquiry form, email, location |
| `/privacy`, `/terms`, `/accessibility` | Legal and accessibility statement |

## 7. Who does what

You own direction and approve every public claim. Claude and the crew build it: design system and front end, the small API, tests, accessibility and security review. Students are not involved in this site. The `/careers` page is aimed at them (roles: web development, content writing, UI/UX and graphics), so it is the page they judge you on.

## 8. Phases

| Phase | Output | Rough time |
|---|---|---|
| 0. Foundations | Confirm domain, services list, real claims, logo. Figma tokens. Monorepo, CI, hosting | 1 week |
| 1. Launchable site | Home, services, about, contact (form stores to Postgres and emails you), legal pages, SEO, accessibility audit | 3-4 weeks |
| 2. Credibility | Case studies, careers and application flow, blog | 2-3 weeks |
| 3. Hardening | Lighthouse and axe budgets, security review, analytics (privacy-friendly), monitoring | 1 week |

Times are estimates, not commitments.

## 9. Decisions only you can make

1. Final domain (`sidedataa.com` vs `sidedata.com` or similar) and company legal name and address for the footer.
2. Which services you genuinely offer today, and any real client names or projects you may show.
3. Whether racks/data-centre work needs its own page with photos.
4. Hosting budget (free tiers work for launch).
5. Logo and brand: keep the current one or let the UI/UX team refine it.

## 10. Definition of done for launch

- axe-core reports zero serious or critical issues, and manual keyboard and screen-reader pass completed
- Lighthouse 95+ on performance, accessibility, best practices and SEO for the main pages
- No placeholder, fabricated or unverifiable claims anywhere
- Contact and career forms tested end to end, with spam protection and a privacy notice
- Security headers set, secrets only in environment variables, dependencies audited
