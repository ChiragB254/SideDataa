# Deploying to Vercel

This is a standard Next.js app; Vercel needs no custom build settings.

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js, build command `npm run build`).
2. Set environment variables (Project Settings, Environment Variables), Production scope:
   - `NEXT_PUBLIC_SITE_URL` = `https://sidedataa.com`
   - `RESEND_API_KEY`, `CONTACT_TO` (defaults to support@sidedataa.com), `CONTACT_FROM`
   - Optional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Set both or neither. With Turnstile enabled, visitors without JavaScript cannot pass the bot check and cannot submit the forms.
3. In Resend, verify the sending domain and use an address on it for `CONTACT_FROM`.
4. Domain: add `sidedataa.com` (and `www`) under Project Settings, Domains, and create the DNS records Vercel shows at your DNS provider. Confirm that sidedataa.com is the domain you want before launch.
5. After the first deploy, submit both forms once and confirm the email arrives. Without `RESEND_API_KEY` the forms return 503 in production.

## Owner checklist before launch

- Confirm the domain and the support@sidedataa.com mailbox.
- Have a lawyer review `/privacy`, `/terms` and `/accessibility`.
- Review service copy in `content/services.ts` and role copy in `content/careers.ts`; remove anything you do not offer. Tech lists need your confirmation.
- Confirm the careers commitments (mentorship, review, written feedback, students welcome) and how you will answer applicants.
- Decide on analytics (none installed) and update the privacy notice if added.
- Add real case studies or client work only when you can approve each claim; none are shown now.
