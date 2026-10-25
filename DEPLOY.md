# Deploying to EC2

The site is hosted on a single EC2 instance, not Vercel. Infrastructure (instance, Caddy, systemd unit, S3 bucket, IAM/OIDC role) is provisioned from `infra/`; see `infra/README.md`. This file covers the app side.

## How a deploy works

Push to `main` (or run the **Deploy** workflow manually). `.github/workflows/deploy.yml` then:

1. runs lint, typecheck and unit tests;
2. builds a standalone release with `scripts/package-release.sh` and uploads `releases/<git-sha>.tar.gz` to the private release bucket;
3. asks the instance (tag `Name=sidedata-web`) over SSM to run `scripts/activate-release.sh <git-sha>`, which smoke-tests the new build on port 3001 before switching the `/opt/sidedata/current` symlink, restarts `sidedata.service`, checks `/healthz`, and restores the previous release if the check fails;
4. curls `https://sidedataa.com/healthz`. This step does not fail the deploy until DNS points at the server.

## One-time setup (owner)

- GitHub repo **variables** (Settings, Secrets and variables, Actions, Variables):
  - `AWS_DEPLOY_ROLE_ARN` = ARN of the `sidedata-github-deploy` role (output of the Terraform in `infra/`)
  - `NEXT_PUBLIC_SITE_URL` = `https://sidedataa.com`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (only if you use Turnstile; public value)
  - optional `AWS_DEPLOY_INSTANCE_ID` (skips the instance lookup), optional `DEPLOY_USE_PRESIGNED_URL=true` (only if the aws CLI is not installed on the server)
- Server environment file **`/etc/sidedata/env`** (this is where the former `.env` contents live; root-owned, read by systemd, never in git or the tarball):
  - `RESEND_API_KEY`, `CONTACT_TO` (defaults to support@sidedataa.com), `CONTACT_FROM`
  - optional `TURNSTILE_SECRET_KEY` plus `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Set both or neither. With Turnstile enabled, visitors without JavaScript cannot pass the bot check and cannot submit the forms.
  - after editing the file: `systemctl restart sidedata.service` (run through SSM Session Manager or SendCommand).
- In Resend, verify the sending domain and use an address on it for `CONTACT_FROM`.
- DNS: point `sidedataa.com` (and `www`) at the instance address from `infra/README.md`. Caddy gets the TLS certificate once DNS resolves to the server. Confirm that sidedataa.com is the domain you want before launch.
- After the first deploy, submit both forms once and confirm the email arrives. Without `RESEND_API_KEY` the forms return 503 in production.

## Rollback

The newest 5 releases stay on the server. To go back, run `activate-release.sh <old-sha>` on the host through SSM. Find the sha in the Deploy run history, with `aws s3 ls s3://sidedata-releases-499024812515/releases/`, or with `ls -1t /opt/sidedata/releases` on the host. The workflow cannot be used for this (it deploys the pushed commit, and the OIDC role only trusts `main`), so send the script the same way the workflow does, from a checkout, with credentials allowed to use SSM:

```bash
b64=$(base64 < scripts/activate-release.sh | tr -d '\n')
aws ssm send-command --region ca-central-1 --instance-ids <instance-id> \
  --document-name AWS-RunShellScript \
  --parameters "commands=[\"echo $b64 | base64 -d > /tmp/activate-release.sh\",\"bash /tmp/activate-release.sh <old-sha>\"]"
```

If the old release was already pruned from the host, the script downloads it again from S3 (unless a lifecycle rule in `infra/` has expired it). Reverting the bad commit on `main` and letting the pipeline deploy is the slower, fully audited alternative.

## Limits you should know about

- Single server: no failover, and a deploy restarts the Node process (a short blip). If the instance dies, recreate it from `infra/` and redeploy.
- The form rate limiter is in memory in that one process: it works, but resets on restart.
- Client IPs are taken from the rightmost `X-Forwarded-For` entry. Caddy replaces any client-supplied `X-Forwarded-For` with the real peer address (no trusted proxies are configured), and the app reads only the last entry as defence in depth. Node listens on 127.0.0.1 only; do not expose port 3000 publicly or the rate limiter can be spoofed.
- Deploys are as trustworthy as the `main` branch; protect it.
- Not yet verified end to end against real AWS (see the PR notes); run the first deploy while watching the Actions log.

## Owner checklist before launch

- Confirm the domain and the support@sidedataa.com mailbox.
- Have a lawyer review `/privacy`, `/terms` and `/accessibility`.
- Review service copy in `content/services.ts` and role copy in `content/careers.ts`; remove anything you do not offer. Tech lists need your confirmation.
- Confirm the careers commitments (mentorship, review, written feedback, students welcome) and how you will answer applicants.
- Decide on analytics (none installed) and update the privacy notice if added.
- Add real case studies or client work only when you can approve each claim; none are shown now.
