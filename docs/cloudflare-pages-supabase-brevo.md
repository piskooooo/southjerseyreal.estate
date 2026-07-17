# Cloudflare Pages, Supabase, and Brevo

Last reviewed: July 17, 2026

This is the production deployment guide for `southjerseyreal.estate`. It intentionally records resource names and public identifiers, but never secret values, contact submissions, or subscriber data.

## Architecture

```mermaid
flowchart LR
  Visitor[Website visitor] --> Pages[Cloudflare Pages]
  Pages --> Turnstile[Cloudflare Turnstile]
  Pages --> Functions[Supabase Edge Functions]
  Functions --> Turnstile
  Functions --> Database[(Private Supabase schema)]
  Functions --> Brevo[Brevo API]
  Brevo --> Leads[leads@southjerseyreal.estate]
  Brevo --> DOI[Newsletter double opt-in]
```

- Frontend: Cloudflare Pages project `southjerseyreal-estate`, connected to `piskooooo/southjerseyreal.estate`, production branch `main`.
- Build: Node 22 on Pages build image v3, `npm run build`, output directory `dist`.
- Backend: Supabase project ref `sinbxruqlaywvbzcvfli` in `us-east-1`.
- Public functions: `contact-submit` and `newsletter-subscribe`. JWT verification is disabled because visitors are anonymous; each function instead enforces an origin allowlist and server-side Turnstile verification.
- Email: Brevo sender `South Jersey Real Estate <arthur@southjerseyreal.estate>`.
- Newsletter: Brevo list ID `8`, double-opt-in template ID `2`.
- Abuse controls: Cloudflare Turnstile, honeypots, bounded request bodies, HMAC-only rate-limit identifiers, and provider cooldowns.
- Retention: private inquiry and newsletter-audit rows expire after 12 months; HMAC-only rate events expire after 48 hours.

## Current Production State

The Pages cutover completed on July 17, 2026.

- `southjerseyreal.estate` and `www.southjerseyreal.estate` are active custom domains on the Pages project.
- Both proxied CNAME records point to `southjerseyreal-estate.pages.dev` and retain their original record IDs.
- Apex record ID: `a3ea2f26be68facb42220974e3168a40`.
- `www` record ID: `9fd184438d7ff9223f0922222167b081`.
- Saved rollback target: `f2cb0161-75ae-4bc1-8bf2-c5f321ad1417.cfargotunnel.com`.
- `BREVO_DOI_REDIRECT_URL` points to `https://southjerseyreal.estate/newsletter?confirmed=1`.
- The old Unraid route is outside public DNS and should remain available only for the observation period described in the project checklist.

## Public Build Variables

Configure these in both the Pages production and preview environments. They are compiled into the browser bundle and are not secrets.

```text
VITE_GA_MEASUREMENT_ID=G-97H86MNHP8
VITE_SUPABASE_URL=https://sinbxruqlaywvbzcvfli.supabase.co
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAD4GwgGgH6mUSw5r
NODE_VERSION=22
```

## Backend Secrets

The Supabase Edge Function secret store must contain the following names. Set values through the dashboard or Supabase CLI without printing them to a terminal transcript or committing them.

```text
BREVO_API_KEY
BREVO_DOI_REDIRECT_URL
BREVO_DOI_TEMPLATE_ID
BREVO_NEWSLETTER_LIST_ID
CONTACT_ALLOWED_ORIGINS
CONTACT_AUDIT_HMAC_KEY
CONTACT_NOTIFICATION_CRON_SECRET
CONTACT_NOTIFICATION_FROM_EMAIL
CONTACT_NOTIFICATION_FROM_NAME
CONTACT_NOTIFICATION_TO_EMAIL
CONTACT_TURNSTILE_EXPECTED_ACTION
NEWSLETTER_ALLOWED_ORIGINS
NEWSLETTER_AUDIT_HMAC_KEY
NEWSLETTER_TURNSTILE_EXPECTED_ACTION
TURNSTILE_EXPECTED_HOSTNAMES
TURNSTILE_SECRET
```

Supabase Vault also stores the protected scheduled-worker URL and cron secret under these names:

```text
sjre_contact_notification_function_url
sjre_contact_notification_cron_secret
```

## Deploy Supabase Changes

Authenticate with the personal Supabase account, then run from the repository root:

```bash
npx supabase link --project-ref sinbxruqlaywvbzcvfli
npx supabase db push
npx supabase functions deploy contact-submit --no-verify-jwt
npx supabase functions deploy newsletter-subscribe --no-verify-jwt
npx supabase db lint --linked --level warning
```

Deploy database migrations before functions when a function depends on a new RPC or table. Confirm both functions remain active and show `verify_jwt: false` after deployment.

## Deploy the Frontend

1. Run `npm ci` and `npm run build` locally.
2. Confirm `dist/_redirects` and `dist/_headers` exist after the build.
3. Commit and push `main` to `origin`.
4. In Cloudflare Pages, confirm the production deployment used Node 22 and finished successfully.
5. Open the deployment URL and check the homepage, one county page, `/contact`, `/newsletter`, `/privacy-policy`, and a nonexistent route.

Cloudflare Pages automatically deploys each push to `main`. Pull requests and non-production branches receive preview deployments.

The GitHub App installation named `Cloudflare Workers and Pages` must include the
`piskooooo/southjerseyreal.estate` repository. If the Pages dashboard reports that
the project is disconnected, open the repository's Pages settings, select
**Manage** beside the Git repository, add this repository to the GitHub App's
repository access, save, and then confirm the warning disappears before pushing.

## Test the Forms

Use clearly labeled test information that can be removed afterward.

1. Submit one Contact request through the deployed website.
2. Confirm the page reports success.
3. Confirm the private Supabase row reaches notification status `sent` without printing its personal fields.
4. Confirm the routed `leads@` mailbox receives the Brevo notification.
5. Submit one Newsletter request with the consent checkbox selected.
6. Confirm the double-opt-in email arrives, follow its confirmation link, and confirm the address enters Brevo list `8` only after confirmation.
7. Confirm the browser console has no CSP, CORS, Turnstile, or mixed-content errors on desktop and mobile widths.
8. Delete the test inquiry, its rate-limit rows, the HMAC-only newsletter audit row, and the Brevo test contact.

Do not use a Turnstile test key in production. The repository's validation script may use a dummy token only to prove the configured secret reaches Siteverify; a rejected dummy response is expected.

## Production Domain Cutover

Do this only after the `pages.dev` deployment and both forms pass.

1. Add `southjerseyreal.estate` and `www.southjerseyreal.estate` as custom domains on the Pages project.
2. Save the current Tunnel DNS record IDs and target for rollback.
3. Replace the apex and `www` Tunnel records with the Pages-managed records Cloudflare requests.
4. Wait until both custom domains report active SSL.
5. Update `BREVO_DOI_REDIRECT_URL` to `https://southjerseyreal.estate/newsletter?confirmed=1` and redeploy `newsletter-subscribe` only if the platform requires a redeploy after a secret change.
6. Repeat the page, form, analytics-consent, security-header, and mobile checks on the production hostnames.
7. Keep the Unraid stack available but out of DNS during the initial observation period.

## Rollback

If Pages or the custom-domain cutover fails:

1. Restore the saved proxied apex and `www` CNAME records to the previous Cloudflare Tunnel target.
2. Confirm the Unraid web container is healthy and serving the current image.
3. Leave Supabase, Brevo, and Turnstile running; current Docker frontend builds use those same services.
4. If the rollback image predates the cloud-form migration, also restore the legacy lead API configuration documented in [`self-host-unraid-cloudflare.md`](./self-host-unraid-cloudflare.md).
5. Record the failure in [`project-todo.md`](./project-todo.md) before attempting another cutover.

After production has remained stable and backups are satisfactory, the old Tunnel route, `lead-api` container, and NAS-hosting secrets can be retired in a separate, deliberate cleanup.
