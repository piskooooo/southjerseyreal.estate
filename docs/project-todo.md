# South Jersey Real Estate Project Checklist

Last reviewed: July 17, 2026

Use this file as the source of truth for unfinished work on `southjerseyreal.estate`. Check an item only after completing its **Done when** test. Never place passwords, SMTP credentials, webhook URLs, lead data, or other secrets in this file.

## Current Priorities

- [x] 1. Complete the Pages cutover and retire the legacy NAS code path
- [x] 2. Confirm the production URL in Google Search Console
- [x] 3. Finish the GA4 lead-conversion setup
- [ ] 4. Get a final real-estate compliance review
- [ ] 5. Select and integrate a Bright IDX provider
- [ ] 6. Deploy and verify the private website editor

## 1. Complete the Cloudflare Pages Cutover

**Goal:** Serve the site and forms without depending on the NAS, with recovery through a known-good Git revision and Cloudflare Pages deployment.

### Provisioning

- [x] Create the personal Supabase project `sinbxruqlaywvbzcvfli`.
- [x] Apply private contact/newsletter storage, HMAC-only rate limiting, notification retry, and 12-month retention migrations.
- [x] Deploy the `contact-submit` and `newsletter-subscribe` Edge Functions.
- [x] Configure the protected contact-notification cron and daily retention cron.
- [x] Authenticate the Brevo sending domain and create the sender, newsletter list, attributes, and double-opt-in template.
- [x] Create the Cloudflare Turnstile widget for production, Pages, and local hostnames.
- [x] Create the Git-connected Cloudflare Pages project `southjerseyreal-estate` with Node 22.
- [x] Configure the Pages production and preview build variables.
- [x] Add Pages SPA routing and security headers.

### Deploy and Cut Over

- [x] Push the migration to `origin/main` and confirm the first Pages build succeeds.
- [x] Test the `pages.dev` deployment on desktop and mobile.
- [x] Add the apex and `www` custom domains to Pages.
- [x] Save the existing Tunnel DNS target, then switch the apex and `www` records to Pages.
- [x] Confirm both production hostnames have active SSL and correct security headers.
- [x] Change the Brevo double-opt-in redirect to the production newsletter confirmation URL.
- [x] Repeat form, navigation, legal-page, analytics-consent, and mobile checks in production.
- [x] Complete the observation period, remove the Docker/Caddy/legacy lead API source and GHCR publishing job, and retain the shared `home-server` Tunnel only because HomeBase CRM still uses it.

Completion date: July 17, 2026

**Done when:** Production traffic, forms, and scheduled delivery work without the NAS, and recovery uses a known-good Pages deployment or Git revision rather than the retired application stack.

Reference: [cloudflare-pages-supabase-brevo.md](./cloudflare-pages-supabase-brevo.md)

## 2. Verify Contact, Newsletter, and Turnstile

**Goal:** Confirm the new anonymous form endpoints are secure, usable, and delivering through Brevo.

### Technical Setup

- [x] Enforce exact browser-origin allowlists on both Edge Functions.
- [x] Validate Turnstile server-side, including the expected action and hostname.
- [x] Keep all service keys and HMAC keys in Supabase secrets or Vault.
- [x] Require explicit newsletter consent and Brevo double opt-in.
- [x] Keep contact inquiries separate from newsletter subscriptions.
- [x] Confirm scheduled notification processing returns a healthy empty-queue response.
- [x] Keep the Supabase Dashboard SQL Editor as the recovery/audit inquiry viewer and keep the service-role key out of the browser.
- [x] Add automated frontend, validation, Brevo-client, notification-lifecycle, and transactional database regression tests.
- [x] Re-review the contact form from the React UI through Turnstile, Supabase storage, Brevo delivery, retry scheduling, and retention; confirm the production build still succeeds (July 17, 2026).

### End-to-End Checks

- [x] Submit one clearly labeled Contact test through the deployed page.
- [x] Confirm the private inquiry reaches notification status `sent`.
- [x] Confirm the routed `leads@` mailbox receives the Brevo notification.
- [x] Submit one clearly labeled Newsletter test with consent selected.
- [x] Confirm the double-opt-in email arrives and the address is not subscribed before confirmation.
- [x] Follow the confirmation link and confirm the address enters Brevo list `8`.
- [x] Confirm there are no CSP, CORS, Turnstile, or mixed-content errors on desktop or mobile.
- [x] Remove the contact test, rate events, newsletter audit rows, and Brevo test contact.
- [x] Confirm ordinary production pages load without a Cloudflare challenge in a normal browser.
- [x] Run Google Search Console URL Inspection against the Pages-hosted production URL and confirm crawling is allowed.

Google Search Console live-tested the apex URL on July 17, 2026 and reported that the URL was available to Google and could be indexed. Cloudflare Bot Fight Mode was disabled because the Free-plan feature challenged the whole hostname and cannot be scoped; Browser Integrity Check remains enabled.

**Done when:** Both forms complete in a normal browser, delivery and double opt-in are confirmed, test data is removed, and ordinary visitors/search crawlers are not blocked.

## 3. Finish GA4 Lead Tracking

**Goal:** Count successful contact and newsletter submissions as conversions.

The site already sends the GA4 event `generate_lead` after a successful form submission.

### Steps

- [x] Accept analytics cookies on the public site for the test session.
- [x] Submit one safe test form.
- [x] Open the GA4 property using measurement ID `G-97H86MNHP8`.
- [x] Confirm `generate_lead` appears in Realtime or DebugView.
- [x] In GA4 Admin, mark `generate_lead` as a key event.
- [x] Confirm ordinary page views and navigation events still appear.
- [x] Record the completion date below.

Completion date: July 17, 2026

**Done when:** GA4 receives `generate_lead` and identifies it as a key event.

## 4. Complete the Human Compliance Review

**Goal:** Have the public-facing legal and advertising details reviewed by someone responsible for New Jersey real-estate compliance.

The technical compliance pass is complete, but it is not a legal certification. The footer currently identifies Arthur Pisko Jr. and NJ real-estate license number `2187170`; the brokerage name is available elsewhere but was intentionally removed from the footer.

### Steps

- [ ] Ask the broker of record or a New Jersey real-estate attorney to review the site.
- [ ] Confirm whether brokerage identification is sufficiently prominent on every required page or advertisement.
- [ ] Review the Privacy Policy, Disclaimer, and Terms of Service.
- [ ] Confirm the Equal Housing Opportunity and REALTOR(R) logo usage is appropriate.
- [ ] Confirm contact forms, newsletter consent, analytics consent, and partner/advertising disclosures are acceptable.
- [ ] Save the reviewer and approval date below. Do not store privileged legal advice in this public repository.
- [ ] Give Codex any approved wording changes to implement and test.

Reviewer: ____________________

Approval date: ____________________

**Done when:** The responsible broker or attorney approves the site or all requested changes have been implemented and approved.

Reference: [compliance-review-checklist.md](./compliance-review-checklist.md)

## 5. Add Bright IDX Property Search

**Goal:** Show eligible Bright IDX listings on `southjerseyreal.estate` and optionally show brokerage-only listings on The Plum Real Estate Group website.

This feature is still in the research stage. Do not scrape Bright or manually republish listing data.

### Phase A: Requirements and Approval

- [ ] Confirm the broker of record approves IDX display on `southjerseyreal.estate`.
- [ ] Confirm whether the personal site and brokerage site require separate Bright approvals, feeds, or subscriptions.
- [ ] Obtain the Bright office ID needed to filter The Plum Real Estate Group listings.
- [ ] Decide the initial geographic scope and property types for the South Jersey search.
- [ ] Decide whether the first release needs only active listings or additional IDX-permitted statuses.

### Phase B: Select a Vendor

- [ ] Shortlist Bright-approved IDX vendors that support a React/Vite website.
- [ ] Ask each vendor about JavaScript embeds, hosted search pages, APIs, map search, saved searches, lead routing, SEO, accessibility, mobile behavior, branding control, and total cost.
- [ ] Confirm the vendor can provide both a broad IDX search and an office-ID-filtered brokerage view.
- [ ] Confirm who handles Bright attribution, usage tracking, refresh schedules, listing removal, disclaimers, and compliance updates.
- [ ] Choose the vendor and complete Bright/vendor approval.

Selected vendor: ____________________

Expected monthly cost: ____________________

Approval date: ____________________

### Phase C: Implement and Launch

- [ ] Give Codex the vendor documentation, approved domain details, and non-secret integration identifiers.
- [ ] Add a `Search Homes` or `Property Search` navigation item without suggesting visitors are directly searching Bright MLS.
- [ ] Build search results, listing details, empty, loading, error, and mobile states supported by the vendor.
- [ ] Add the vendor-required Bright attribution, listing-broker identification, contact details, and disclaimers.
- [ ] Route listing inquiries through the configured lead destination.
- [ ] Test search filters, maps, listing pages, inquiry forms, accessibility, mobile layouts, analytics, and expired/removed listing behavior.
- [ ] Launch on the preview hostname and obtain any required vendor or Bright approval before production.
- [ ] Verify the production integration and document its renewal and support details.

**Done when:** The approved property search is live, compliant, mobile-friendly, and successfully delivers a test listing inquiry.

## 6. Deploy the Private Website Editor

**Goal:** Manage the real public-site content from a private `/admin` page using one UUID-authorized Supabase account.

### Completed Implementation

- [x] Add a lazy-loaded `/admin` application that is separate from the public header/footer, uses the South Jersey visual theme, works at desktop and mobile widths, and is protected by page-level and HTTP `noindex` directives.
- [x] Build password, magic-link, password-recovery, session-refresh, unauthorized, configuration-error, and sign-out states without exposing public signup or committing the administrator email.
- [x] Cover sitewide navigation, footer, and privacy content plus all 19 public routes, including the seven county guides, resource/comparison pages, FAQ, and legal pages, as structured editable documents with compiled fallbacks.
- [x] Add recursive field editing, unsaved/saved/published status, draft save, atomic publish, discard-to-published, optimistic-concurrency checks, safe-link validation, and required image alt-text validation.
- [x] Add JPG, PNG, WebP, and AVIF uploads with file and decoded-dimension limits, optimized page/admin variants, replacement/removal handling, and storage cleanup warnings.
- [x] Add the private, paginated contact-inquiry inbox without exposing the `private` schema or a service-role key to the browser.
- [x] Add the local Supabase migration for the one-slot UUID administrator table, public published-only content, private drafts, RLS/grants, audited publish/revert/inquiry RPCs, and the admin-write-only `site-images` storage policies.
- [x] Add the authenticated `site-rebuild` Edge Function with origin validation, JWT/user verification, UUID administrator verification, strict deploy-hook URL validation, and fail-closed error handling.
- [x] Connect the public layouts to published Supabase content with compiled fallbacks, and add route-specific HTML/metadata plus sitemap prerendering for crawler-visible SEO changes.
- [x] Add editor content/inbox tests and transactional pgTAP coverage. The current verification passes 51 Vitest tests, 49 database checks, the production build, Deno formatting/type checks, and public/fail-closed browser checks.
- [x] Push implementation commit `d98b8f5` to `origin/main`; confirm the Cloudflare Pages production deployment, GitHub web-test job, and both GHCR image builds succeed.

### Production Activation and Acceptance

- [x] Apply both website-editor migrations to the production Supabase project, including the stable composite inbox cursor.
- [x] Keep public signup disabled, create only the approved owner account, and send its invitation through Supabase Auth.
- [ ] Have the owner accept the invitation and choose the permanent password; never record or share it.
- [x] Bind that account's UUID to slot `1` in `private.site_admins`, verify the one-slot constraint, and confirm no second production Auth account exists.
- [x] Configure the Supabase Auth site URL and production, `www`, Pages-preview, and local `/admin` callback URLs.
- [x] Add `VITE_SUPABASE_PUBLISHABLE_KEY` to both Pages production and preview variables. Never use the service-role key in the browser.
- [ ] Rebuild Pages with the publishable key and confirm `/admin` advances past the fail-closed configuration gate.
- [x] Create the `main` Pages Deploy Hook named `website-editor`.
- [x] Save the hook URL only as the Supabase secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`.
- [x] Deploy `site-rebuild` with JWT verification disabled at the gateway because the function verifies the bearer user and UUID membership itself, then confirm the function is active.
- [x] Run the linked database lint and verify the migration ledger, function, secret name, image bucket, sole-admin binding, grants, and anonymous inbox/write denials in production.
- [ ] Test password sign-in, magic-link sign-in, password recovery, session reload, sign-out, signed-out access, and a non-administrator denial. Verify Auth email delivery; configure dedicated Auth SMTP only if the built-in delivery is not reliable.
- [ ] Confirm every sitewide/page document loads from its compiled seed, a first draft save creates its row without changing the public page, refresh preserves the draft, publish changes only the intended public fields, discard restores the published revision, and a stale second tab cannot overwrite newer work.
- [ ] Upload, replace, publish, and remove a test image; confirm full and admin variants render, unsupported/oversized images are rejected, replaced files are cleaned up, and desktop/tablet/mobile layouts remain correct.
- [ ] Verify the contact inbox returns retained inquiries only to the assigned UUID, paginates correctly, exposes nothing to anonymous/non-admin sessions, and does not print or commit inquiry data during testing.
- [ ] Publish a temporary SEO title/description/image test, confirm the deploy hook starts a successful Pages build and the rebuilt route HTML, canonical/social metadata, and sitemap use the published values, then restore the intended copy and confirm the restoration rebuild.
- [ ] Repeat the authorized editor workflow on production desktop, tablet, and mobile, check the browser console/network log, remove temporary content/images/test records, and record the completion date.
- [x] Retire the obsolete Unraid/Caddy/legacy lead API and GHCR publishing path; keep Docker only for local Supabase regression tests.

Production provisioning verified July 17, 2026: both editor migrations are applied and lint clean; the sole invited Auth UUID owns slot `1`; callback URLs and both Pages variables are configured; the protected deploy-hook secret exists; and all three Edge Functions are active. The remaining acceptance work begins after the owner accepts the invitation and the next Pages build publishes the configured frontend.

**Done when:** Only the assigned Auth UUID can use `/admin`, published edits appear on the public site, crawler metadata rebuilds successfully, private inquiries remain protected, and desktop/tablet/mobile verification passes.

## Completed Work

- [x] Rebuild and self-host the React/Vite site.
- [x] Retire the former Unraid/Caddy/legacy lead API deployment files and stop GHCR image publishing after the Pages cutover.
- [x] Add privacy controls, legal pages, accessibility improvements, and security headers.
- [x] Add contact and newsletter form support to the lead API.
- [x] Add HomeBase CRM and The Plum Real Estate Group to the Partners page.
- [x] Use routed `southjerseyreal.estate` email addresses in public content.
- [x] Add favicon and Apple touch icon metadata.
- [x] Remove the GitHub Actions Node 20 deprecation annotations.
- [x] Fix the iPad town-card grid and finish the wider responsive layout.
- [x] Add repository identity and push-target instructions to `AGENTS.md`.
- [x] Move production hosting to Cloudflare Pages with active apex and `www` domains.
- [x] Move contact and newsletter handling to Supabase, Turnstile, and Brevo.
- [x] Verify contact delivery and newsletter double opt-in end to end, then remove all test records.
- [x] Save the reusable Turnstile Spin workflow under `.codex/skills/turnstile-spin` for future chats.
- [x] Add 51 Vitest tests plus a 49-check transactional Supabase pgTAP suite, and keep the GitHub test workflow on every push.
- [x] Build and publish the private website-editor frontend, database migration, image/inbox support, managed public-content adapter, and SEO rebuild implementation while keeping production access fail-closed until provisioning is complete.
- [x] Document private inquiry access, production test cleanup, Pages recovery, retired NAS resources, and the final human compliance handoff.
