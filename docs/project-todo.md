# South Jersey Real Estate Project Checklist

Last reviewed: July 17, 2026

Use this file as the source of truth for unfinished work on `southjerseyreal.estate`. Check an item only after completing its **Done when** test. Never place passwords, SMTP credentials, webhook URLs, lead data, or other secrets in this file.

## Current Priorities

- [ ] 1. Observe the Pages deployment, then retire the NAS route
- [x] 2. Confirm the production URL in Google Search Console
- [x] 3. Finish the GA4 lead-conversion setup
- [ ] 4. Get a final real-estate compliance review
- [ ] 5. Select and integrate a Bright IDX provider
- [ ] 6. Deploy and verify the private website editor

## 1. Observe the Cloudflare Pages Cutover

**Goal:** Serve the site and forms without depending on the NAS, while keeping a tested rollback path during the transition.

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
- [ ] Keep the Unraid route available outside DNS during an observation period, then schedule its retirement separately.

**Done when:** Production traffic, forms, and scheduled delivery work without the NAS, and the documented DNS rollback has been verified.

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

- [x] Build the responsive South Jersey-themed editor with password, magic-link, and recovery flows.
- [x] Add structured draft, publish, discard, image-upload, optimistic-concurrency, private-inbox, and SEO-rebuild support.
- [x] Add a single-slot private administrator table, fail-closed RLS/RPC checks, storage policies, and database regression tests without committing the administrator email.
- [x] Connect all public page layouts, navigation, footer, privacy copy, comparison/resource content, and SEO fields to published documents with compiled fallbacks.
- [ ] Apply the website-editor migration to the production Supabase project.
- [ ] Create the sole Auth account and bind its UUID to slot `1` in `private.site_admins`.
- [ ] Configure production and preview Auth callback URLs plus `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Create the `main` Pages Deploy Hook, save it as `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`, and deploy `site-rebuild`.
- [x] Push the implementation to `origin/main` and confirm the Pages deployment succeeds.
- [ ] Test sign-in, fail-closed unauthorized access, draft/save/publish/discard, image replacement, contact-inbox privacy, mobile layout, and sign-out.
- [ ] Publish an SEO test and confirm the rebuilt route HTML and sitemap use the new metadata, then restore the intended copy.

Implementation commit `d98b8f5` was pushed to `origin/main` on July 17, 2026. The Cloudflare Pages deployment, web-form test job, and both GHCR image builds succeeded. Production database/authentication configuration, `site-rebuild` deployment, and live editor verification remain outstanding.

**Done when:** Only the assigned Auth UUID can use `/admin`, published edits appear on the public site, crawler metadata rebuilds successfully, private inquiries remain protected, and desktop/mobile verification passes.

## Completed Work

- [x] Rebuild and self-host the React/Vite site.
- [x] Publish the web and lead API images through GitHub Actions and GHCR.
- [x] Configure the production domain through Cloudflare Tunnel.
- [x] Add privacy controls, legal pages, accessibility improvements, and security headers.
- [x] Add contact and newsletter form support to the lead API.
- [x] Add HomeBase CRM and The Plum Real Estate Group to the Partners page.
- [x] Use routed `southjerseyreal.estate` email addresses in public content.
- [x] Add favicon and Unraid Docker icon metadata.
- [x] Remove the GitHub Actions Node 20 deprecation annotations.
- [x] Fix the iPad town-card grid and finish the wider responsive layout.
- [x] Add repository identity and push-target instructions to `AGENTS.md`.
- [x] Move production hosting to Cloudflare Pages with active apex and `www` domains.
- [x] Move contact and newsletter handling to Supabase, Turnstile, and Brevo.
- [x] Verify contact delivery and newsletter double opt-in end to end, then remove all test records.
- [x] Save the reusable Turnstile Spin workflow under `.codex/skills/turnstile-spin` for future chats.
- [x] Add 45 automated form and analytics tests plus a transactional Supabase pgTAP regression suite, and gate GHCR publishing on the 45-test Vitest run.
- [x] Document private inquiry access, production test cleanup, scoped NAS retirement, and the final human compliance handoff.
