# Cloudflare Pages, Supabase, and Brevo

Last reviewed: July 17, 2026

This is the production deployment guide for `southjerseyreal.estate`. It intentionally records resource names and public identifiers, but never secret values, contact submissions, or subscriber data.

## Architecture

```mermaid
flowchart LR
  Visitor[Website visitor] --> Pages[Cloudflare Pages]
  Admin[Authorized owner] --> Pages
  Admin --> Auth[Supabase Auth]
  Pages --> Turnstile[Cloudflare Turnstile]
  Pages --> Functions[Supabase Edge Functions]
  Admin --> Database
  Functions --> Turnstile
  Functions --> Database[(Private Supabase schema)]
  Functions --> DeployHook[Cloudflare Pages deploy hook]
  Functions --> Brevo[Brevo API]
  Brevo --> Leads[leads@southjerseyreal.estate]
  Brevo --> DOI[Newsletter double opt-in]
```

- Frontend: Cloudflare Pages project `southjerseyreal-estate`, connected to `piskooooo/southjerseyreal.estate`, production branch `main`.
- Build: Node 22 on Pages build image v3, `npm run build`, output directory `dist`.
- Backend: Supabase project ref `sinbxruqlaywvbzcvfli` in `us-east-1`.
- Public functions: `contact-submit` and `newsletter-subscribe`. JWT verification is disabled because visitors are anonymous; each function instead enforces an origin allowlist and server-side Turnstile verification.
- Authenticated function: `site-rebuild`. Gateway JWT verification is disabled so the function can return controlled responses, but it verifies the bearer user, exact allowed origin, private administrator slot, and protected hook URL before queueing a build.
- Email: Brevo sender `South Jersey Real Estate <arthur@southjerseyreal.estate>`.
- Newsletter: Brevo list ID `8`, double-opt-in template ID `2`.
- Abuse controls: Cloudflare Turnstile, honeypots, bounded request bodies, HMAC-only rate-limit identifiers, and provider cooldowns.
- Retention: private inquiry and newsletter-audit rows expire after 12 months; HMAC-only rate events expire after 48 hours.
- Private inquiry access: the authenticated, single-administrator `/admin` inbox backed by a UUID membership check. The browser never receives a service-role key, and the `private` schema remains outside the Data API.

## Current Production State

The Pages cutover completed on July 17, 2026.

- `southjerseyreal.estate` and `www.southjerseyreal.estate` are active custom domains on the Pages project.
- Both proxied CNAME records point to `southjerseyreal-estate.pages.dev` and retain their original record IDs.
- Apex record ID: `a3ea2f26be68facb42220974e3168a40`.
- `www` record ID: `9fd184438d7ff9223f0922222167b081`.
- `BREVO_DOI_REDIRECT_URL` points to `https://southjerseyreal.estate/newsletter?confirmed=1`.
- The old Unraid application route and GHCR publishing workflow are retired. The shared `home-server` Tunnel remains because HomeBase CRM uses it; it is not part of this site's recovery path.
- Cloudflare Bot Fight Mode is off because its Free-plan behavior challenged every route and could not be scoped. Browser Integrity Check remains on. Form POSTs continue to be protected by server-verified Turnstile, exact origin allowlists, honeypots, and application rate limits.
- Google Search Console live URL inspection reported the apex URL available to Google and indexable on July 17, 2026.

Both public forms intentionally use the Turnstile action `turnstile-spin-v2`. This shared action is required by the saved Turnstile Spin workflow and its telemetry. It is not an endpoint ambiguity: each Edge Function independently checks the exact action, expected hostname, and browser origin before processing its own request shape.

## Public Build Variables

Configure the Supabase, Turnstile, and Node values in both the Pages production and preview environments. They are compiled into the browser bundle and are not secrets. Configure the production GA4 measurement ID only in the production environment; leave it unset in preview. As a defense in depth, the client refuses to load a non-test Analytics ID anywhere except the exact canonical hostname `southjerseyreal.estate`, so local QA, `www`, and `*.pages.dev` traffic cannot enter the production property.

```text
VITE_GA_MEASUREMENT_ID=G-97H86MNHP8
VITE_SUPABASE_URL=https://sinbxruqlaywvbzcvfli.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<browser-safe Supabase publishable key>
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAD4GwgGgH6mUSw5r
NODE_VERSION=22
```

For CI browser tests only, the workflow builds with `VITE_GA_MEASUREMENT_ID=G-TEST123`. The client permits that inert test ID on `localhost` and `127.0.0.1`; do not use the production measurement ID for local or preview testing.

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
CLOUDFLARE_PAGES_DEPLOY_HOOK_URL
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
npx supabase functions deploy site-rebuild --no-verify-jwt
npx supabase db lint --linked --level warning
```

Deploy database migrations before functions when a function depends on a new RPC or table. Confirm all three functions remain active and show `verify_jwt: false` after deployment; each function performs its own request validation.

### Provision the private website editor

1. In Supabase Auth, keep global public signup disabled and add `/admin` callback URLs for the production, Pages preview, and local origins. Keep the email provider enabled so the invited owner can use password and recovery login: `[auth] enable_signup = false` blocks new accounts while `[auth.email] enable_signup = true` keeps email authentication available to the existing account.
2. Create the sole administrator Auth account through the dashboard. Do not add its email address to source code or browser authorization logic.
3. Copy that account's Auth user UUID and bind the private single-user slot in the SQL Editor:

```sql
insert into private.site_admins (slot, user_id)
values (1, '<AUTH_USER_UUID>'::uuid)
on conflict (slot) do update
set user_id = excluded.user_id,
    updated_at = clock_timestamp();
```

4. In Cloudflare Pages, create a Deploy Hook named `website-editor` for `main`. Store its URL only as the Supabase Edge Function secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`.
5. Add `VITE_SUPABASE_PUBLISHABLE_KEY` to both Pages production and preview build variables. It is browser-safe; never substitute the service-role key.
6. Deploy `site-rebuild`, then test password sign-in, magic-link sign-in, draft save, publish, discard, image replacement, the private inquiry inbox, and sign-out.
7. After publishing an SEO-title test, confirm the hook starts a Pages build and the rebuilt route HTML contains the new `<title>`, description, canonical URL, social metadata, and `<!-- seo-prerendered -->` marker.

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

Run the automated checks before every forms deployment:

```bash
npm test
npm run build
npx deno check --node-modules-dir=auto supabase/functions/contact-submit/index.ts
npx deno check --node-modules-dir=auto supabase/functions/newsletter-subscribe/index.ts
```

Run the transactional database checks when Docker and the local Supabase stack are available:

```bash
npx supabase start
npm run test:db
```

The database test runs inside a transaction and covers private-schema privileges, contact idempotency and rate limits, notification state transitions, newsletter cooldowns, retention, and cron configuration.

## View Private Contact Inquiries

Use `/admin`, open **Contact**, and select **Manage inquiries**. Access is granted only when the signed-in Auth user UUID owns the private administrator slot. For recovery or database auditing, the Supabase Dashboard SQL Editor remains available while signed in to the project-owner account with MFA.

Do not create shared accounts, expose the `private` schema through the Data API, export inquiries to an unmanaged file, or add a service-role key to the browser.

```sql
select
  request_id,
  created_at,
  name,
  email,
  phone,
  interest,
  message,
  source_path,
  notification_status,
  notification_attempt_count,
  last_notification_attempt_at,
  sent_at,
  expires_at
from private.contact_inquiries
order by created_at desc
limit 100;
```

For a production test, inspect only the delivery metadata needed for verification. Copy the exact `request_id` UUID from the clearly labeled test row, then remove only that request and its rate events in one transaction:

```sql
begin;

delete from private.contact_rate_limit_events
where request_id = '<replace-with-exact-request-id>'::uuid;

delete from private.contact_inquiries
where request_id = '<replace-with-exact-request-id>'::uuid;

commit;

select count(*) as inquiry_rows_remaining
from private.contact_inquiries
where request_id = '<replace-with-exact-request-id>'::uuid;

select count(*) as rate_event_rows_remaining
from private.contact_rate_limit_events
where request_id = '<replace-with-exact-request-id>'::uuid;
```

Both counts must return zero. Never paste real inquiry data into logs, tickets, commits, or chat transcripts.

## Production Domain Verification

The Pages cutover is complete. After deployment changes, confirm that the apex, `www`, and `pages.dev` hostnames serve the expected revision, that the apex and `www` Pages custom domains remain active with valid SSL, and that both public forms still use the production Brevo redirect and Supabase endpoints.

## Recovery

If a frontend release fails, redeploy the last known-good Cloudflare Pages deployment or revert the faulty Git revision and push `main`. Leave Supabase, Brevo, Turnstile, and the Pages custom-domain DNS records in place unless the incident is isolated to one of those services. If a database or Edge Function release fails, restore the last known-good function and apply a forward migration; never rewrite production migration history.

The retired Unraid containers, GHCR packages, and any South Jersey Real Estate ingress entries are not required for recovery. If they still exist outside this repository, remove only project-scoped resources during routine infrastructure maintenance. Never delete or alter the shared `home-server` Tunnel or HomeBase CRM routes while maintaining this site.
