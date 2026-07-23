# South Jersey Real Estate Project Checklist

Last reviewed: July 22, 2026

Use this file as the source of truth for unfinished work on `southjerseyreal.estate`. Check an item only after completing its **Done when** test. Never place passwords, SMTP credentials, webhook URLs, lead data, or other secrets in this file.

## Current Priorities

- [x] 1. Complete the Pages cutover and retire the legacy NAS code path
- [x] 2. Confirm the production URL in Google Search Console
- [x] 3. Finish the GA4 lead-conversion setup
- [x] 4. Complete the current-site compliance review
- [x] 6. Deploy and verify the private website editor
- [x] 7. Refine the dark theme color palette (Midnight Editorial approved July 22, 2026)
- [x] 8. Add destination pages for the Counties and Connect header items
- [x] 9. Rebuild richer, sourced community profiles
- [x] 10. Add client reviews to the About page
- [x] 11. Prepare a comprehensive marketing-ready project description and status-labeled feature list
- [x] 12. Add the intended HomeBase CRM and The Plum Real Estate Group links to the provider/partner presentation
- [x] 13. Add an optional, analytics-tracked Support SJRE link

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

**Goal:** Count successful contact inquiries as leads and keep newsletter subscriptions analytically distinct.

The site sends the recommended GA4 event `generate_lead` plus the direct key event `contact_lead` after a successful contact inquiry, and `sign_up` after a successful newsletter subscription. These carry only allowlisted, low-cardinality form parameters; none sends form contents, email addresses, phone numbers, or link labels.

### Steps

- [x] Accept analytics cookies on the public site for the test session.
- [x] Submit one safe test form.
- [x] Open the GA4 property using measurement ID `G-97H86MNHP8`.
- [x] Confirm `generate_lead` appears in Realtime or DebugView.
- [x] Confirm the former `generate_lead` key designation was replaced by the direct `contact_lead` key event.
- [x] Confirm ordinary page views and navigation events still appear.
- [x] Restrict the production measurement ID to the exact canonical production hostname.
- [x] Strip non-attribution queries and fragments from page locations, carry the prior virtual URL as the SPA referrer, and suppress duplicate virtual page views.
- [x] Remove raw `mailto:`, `tel:`, link-label, query-string, and fragment values from click events.
- [x] In Enhanced Measurement, turn off **Outbound clicks** because the site now sends a sanitized custom outbound-click event and the automatic listener can capture an unsanitized destination URL.
- [x] Make the initial page view independent of the remote published-content request.
- [x] On consent withdrawal, set the GA disable flag, remove GA cookies and the loader, and reload production into a clean denied-consent runtime.
- [x] In Enhanced Measurement, turn off **Page changes based on browser history events** while retaining the site's manual SPA page views.
- [x] Register event-scoped custom dimensions for `form_name`, `lead_type`, and `link_source`.
- [x] Mark direct `contact_lead` as the only editable lead key event; keep `generate_lead` as a standard non-key event and newsletter `sign_up` as a non-key event.
- [x] Recheck the accepted debug events in Google Analytics' visual DebugView after adding `debug_mode` to the configuration and event payloads and allowing Google's documented GA4 and Tag Assistant CSP endpoints. The controlled Chrome session still reported zero debug devices; Google documents that client-side privacy controls can prevent otherwise consented events from appearing there, so this is closed as a diagnostic-interface limitation rather than a production tracking blocker.
- [x] Record the completion date below.

Initial lead-event completion: July 17, 2026. Privacy and SPA measurement hardening: July 18, 2026.

Production collection was reverified on July 19, 2026. Google accepted debug-mode requests for exactly one home `page_view`, one Counties SPA `page_view` with the home URL as `page_referrer`, `generate_lead`, `contact_lead`, and newsletter `sign_up`, all under `G-97H86MNHP8`. Clearly labeled production contact and newsletter submissions completed successfully, and the exact Supabase, rate-limit, newsletter-audit, and Brevo test records were removed. A final pass added event-level debug signals and Google's documented GA4/Tag Assistant CSP endpoints. Tag Assistant and DebugView still did not attach in the controlled Chrome environment, which Google documents can occur with client-side privacy controls; the accepted collection requests, configured key event, and populated standard reports remain the production acceptance evidence.

**Done when:** GA4 receives one privacy-safe page view per route, records contact inquiries as one `contact_lead` plus one standard `generate_lead`, records newsletters separately as `sign_up`, and identifies only `contact_lead` as the editable lead key event.

## 4. Complete the Human Compliance Review

**Goal:** Have the public-facing legal and advertising details reviewed by someone responsible for New Jersey real-estate compliance.

The July 18 technical remediation is complete, but it is not a legal certification. The brokerage name, descriptor, licensed-office phone, broker link, salesperson license type, and salesperson license number appear in one visible sitewide footer disclosure. Active REALTOR® membership is owner-confirmed and publicly corroborated, so the membership mark is restored without storing private membership or MLS identifiers. The unpaid real-estate provider directory is restored with current public-profile verification and remains separate from paid local advertising.

### Steps

- [x] Obtain responsible review. The owner reports broad broker consent, and the owner's attorney advised replacing the repeated compliance-heavy presentation with layered disclosures.
- [x] Implement sitewide broker identity, office-phone, license, fair-housing, neutral-community-copy, consent, privacy, provider, metadata, and publishing guardrails from the July 18 audit.
- [x] Run the audit scans plus production build, 92 unit tests, 49 tracked database checks, and 37 rendered-route/browser acceptance checks across 21 public routes.
- [x] Recheck the implemented license, brokerage, broker-of-record, licensed-office, and affiliation facts against NJDOBI public records.
- [x] Audit the production Cloudflare Pages, Supabase, Brevo, and GA4 configuration inventories without recording secret values or personal data.
- [x] Measure the brokerage-disclosure hierarchy and contrast at desktop and mobile widths, capture rendered evidence, and prepare the concise [compliance review packet](./compliance-review-packet.md) for the human reviewer.
- [x] Owner accepted the current production brokerage identification and hierarchy on July 19, 2026.
- [x] Owner accepted the current Privacy Policy, Disclaimer, Terms of Service, Fair Housing statement, and Equal Housing Opportunity treatment for this project on July 19, 2026.
- [x] Owner accepted the current contact forms, newsletter consent, analytics consent, and partner/advertising disclosures on July 19, 2026.
- [x] Restore the unpaid real-estate provider directory after checking each published lender and title-company entry against a current official profile; keep paid advertising limited to businesses outside the real-estate transaction.
- [x] Restore the REALTOR® mark after owner confirmation and public-profile corroboration; keep private membership and MLS identifiers outside the repository.
- [x] Save the owner disposition and completion date below without storing privileged legal advice or representing it as independent legal certification.
- [x] Implement the attorney's presentation feedback by keeping concise sitewide identity and form notices, moving full explanations to legal pages, and restoring normal editorial voice.
- [x] Schedule a quarterly license, office-fact, credential, tracker, provider-relationship, and public-claim review. The Codex automation runs every three months beginning October 18, 2026.

Review record: Attorney presentation feedback was received July 18, 2026; the site owner accepted the current rendered production site and closed this project task on July 19, 2026. This records the owner's project decision and does not claim a new independent legal certification.

Completion date: July 19, 2026

**Done when:** The owner accepts the implemented current-site presentation after the recorded broker and attorney input, with future features reviewed separately when they are introduced.

Reference: [compliance-review-checklist.md](./compliance-review-checklist.md)

## Separate Deferred Backlog

Bright IDX and property-search planning is not part of the current `southjerseyreal.estate` roadmap. The preserved research and implementation checklist now live in [bright-idx-backlog.md](./bright-idx-backlog.md) for possible use in a different project.

## 6. Deploy the Private Website Editor

**Goal:** Manage the real public-site content from a private `/admin` page using one UUID-authorized Supabase account.

### Completed Implementation

- [x] Add a lazy-loaded `/admin` application that is separate from the public header/footer, uses the South Jersey visual theme, works at desktop and mobile widths, and is protected by page-level and HTTP `noindex` directives.
- [x] Build password, magic-link, password-recovery, session-refresh, unauthorized, configuration-error, and sign-out states without exposing public signup or committing the administrator email.
- [x] Cover sitewide navigation, footer, and privacy content plus all 21 public routes, including both hub pages, the seven county guides, resource/comparison pages, FAQ, and legal pages, as structured editable documents with compiled fallbacks.
- [x] Add recursive field editing, unsaved/saved/published status, draft save, atomic publish, discard-to-published, optimistic-concurrency checks, safe-link validation, and required image alt-text validation.
- [x] Add JPG, PNG, WebP, and AVIF uploads with file and decoded-dimension limits, optimized page/admin variants, replacement/removal handling, and storage cleanup warnings.
- [x] Add the private, paginated contact-inquiry inbox without exposing the `private` schema or a service-role key to the browser.
- [x] Add the local Supabase migration for the one-slot UUID administrator table, public published-only content, private drafts, RLS/grants, audited publish/revert/inquiry RPCs, and the admin-write-only `site-images` storage policies.
- [x] Add the authenticated `site-rebuild` Edge Function with origin validation, JWT/user verification, UUID administrator verification, strict deploy-hook URL validation, and fail-closed error handling.
- [x] Connect the public layouts to published Supabase content with compiled fallbacks, and add route-specific HTML/metadata plus sitemap prerendering for crawler-visible SEO changes.
- [x] Add editor content/inbox/image tests and transactional pgTAP coverage. The current verification passes 92 Vitest tests, 49 database checks, the production build, Deno formatting/type checks, and public/fail-closed browser checks.
- [x] Push implementation commit `d98b8f5`, activation/retirement commit `1698230`, and Pages routing fix `5ead7ea` to `origin/main`; confirm the Cloudflare Pages production deployments and GitHub test workflow succeed.

### Production Activation and Acceptance

- [x] Apply both website-editor migrations to the production Supabase project, including the stable composite inbox cursor.
- [x] Keep public signup disabled, create only the approved owner account, confirm invitation delivery, and accept the invitation through Supabase Auth.
- [x] Have the owner choose the permanent password and confirm password sign-in/sign-out; never record or share it.
- [x] Bind that account's UUID to slot `1` in `private.site_admins`, verify the one-slot constraint, and confirm no second production Auth account exists.
- [x] Configure the Supabase Auth site URL and production, `www`, Pages-preview, and local `/admin` callback URLs.
- [x] Add `VITE_SUPABASE_PUBLISHABLE_KEY` to both Pages production and preview variables. Never use the service-role key in the browser.
- [x] Rebuild Pages with the publishable key and confirm `/admin` advances past the fail-closed configuration gate while signed-out requests remain non-indexable and non-cacheable.
- [x] Create the `main` Pages Deploy Hook named `website-editor`.
- [x] Save the hook URL only as the Supabase secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`.
- [x] Deploy `site-rebuild` with JWT verification disabled at the gateway because the function verifies the bearer user and UUID membership itself, then confirm the function is active.
- [x] Run the linked database lint and verify the migration ledger, function, secret name, image bucket, sole-admin binding, grants, and anonymous inbox/write denials in production.
- [x] Verify invitation/magic-link authentication, session reload, signed-out access, password sign-in/sign-out, the complete recovery-email/callback/password flow, exact one-user Auth state, and automated anonymous/non-administrator denials.
- [x] Confirm all 22 sitewide/page documents load from compiled seeds, a first draft creates only a private row, refresh preserves it, publish changes only the intended fields, live Discard restores the published revision, unsafe links are blocked, and a stale second tab cannot overwrite the newer revision.
- [x] Upload, replace, and remove a temporary image in a private draft; publish and publicly render a storage-backed full-size image while the editor uses its admin variant; publish its removal; verify replacement/removal cleanup and final zero-object cleanup; and cover unsupported, oversized, and unsafe-dimension rejection with automated tests.
- [x] Verify the assigned UUID can open the private contact inbox, anonymous access/draft columns remain denied, the stable composite cursor passes database pagination coverage, and no inquiry data is printed or committed.
- [x] Publish temporary FAQ title, description, image, and content markers; confirm the protected hook starts successful Pages builds and the rebuilt title, description, canonical/social metadata, structured data, and sitemap update; then delete the two exact test-only page rows and rebuild the original compiled content.
- [x] Complete the authorized edit/publish workflow on desktop and responsive editor/inbox checks at `768×1024`, `390×844`, and `360×800`; confirm no horizontal overflow or browser warnings/errors and remove every temporary content/image/database record.
- [x] Retire the obsolete Unraid/Caddy/legacy lead API and GHCR publishing path; keep Docker only for local Supabase regression tests.

Production provisioning and acceptance verified July 17, 2026: both editor migrations are applied and lint clean; the sole confirmed Auth UUID owns slot `1`; the email provider supports password/recovery login while public signup remains disabled; callback URLs and the publishable key are configured in both Pages environments; the protected deploy-hook secret exists; all three Edge Functions are active; and authentication, draft/publish/discard/concurrency/image/inbox/SEO/responsive checks passed with exact QA cleanup.

**Done when:** Only the assigned Auth UUID can use `/admin`, published edits appear on the public site, crawler metadata rebuilds successfully, private inquiries remain protected, and desktop/tablet/mobile verification passes.

## 7. Refine the Dark Theme Color Palette

**Goal:** Give the dark theme a more intentional, balanced palette while preserving readability, accessibility, and the established South Jersey Real Estate identity.

Reopened and approved by the owner on July 22, 2026. Midnight Editorial is the final production dark-theme direction.

Research completed July 18, 2026. The [palette report](./dark-theme-palette-review.md), [interactive comparison](./dark-theme-palette-preview.html), and desktop/mobile screenshots preserve the three tested directions and the selected implementation record.

### Design and Implementation

- [x] Audit the current dark-theme tokens and identify surfaces that feel too flat, harsh, or dominated by one color family.
- [x] Prepare two or three restrained palette directions using distinct background, surface, border, text, link, action, success, warning, and error colors.
- [x] Choose the preferred palette before replacing production colors. Midnight Editorial adapts Atlantic Signal with a deeper blue-black canvas and State Buff actions so it fits the new fashion-editorial layout.
- [x] Map the chosen colors to semantic CSS variables instead of scattering one-off values through components.
- [x] Apply the palette consistently to the public site, forms, menus, footer, and cookie controls without changing the light theme unintentionally. The private editor remains intentionally light-only and visually isolated from public theme state.
- [x] Confirm logos, photography, focus states, disabled states, and form validation remain clear against the new colors.

### Verification

- [x] Check text, link, control, and focus contrast against WCAG AA targets for all three proposed directions.
- [x] Inspect all 21 public routes in dark mode at `1440×1000`, `768×1024`, and `390×844`, plus the intentionally light-only `/admin` boundary at all three responsive classes.
- [x] Confirm there is no clipping, overlap, unreadable state, or horizontal overflow in either theme.
- [x] Obtain final visual approval before closing the palette task. Owner approved Midnight Editorial on July 22, 2026.

The July 22 implementation passes the full rendered compliance suite, a 63-state public route crawl across desktop/tablet/mobile, interaction checks for theme switching, menus, accordions, county details, and field focus, and a separate responsive check that the private editor remains light-only. The owner gave final visual approval on July 22, 2026.

Completion date: July 22, 2026

**Done when:** The approved dark palette is consistent across public surfaces, the intentionally light-only private editor remains isolated, contrast expectations are met, and desktop/tablet/mobile visual checks pass without regressing the light theme.

## 8. Add Counties and Connect Hub Pages

**Goal:** Make the `Counties` and `Connect` header labels lead to useful destination pages while preserving their dropdown menus and keyboard-accessible navigation.

### Content and Routing

- [x] Confirm `/counties` and `/connect` as the final route names and decide the content hierarchy for each page.
- [x] Build a Counties hub introducing the South Jersey coverage area and linking clearly to all seven county guides.
- [x] Build a Connect hub that organizes the relevant About, Contact, Newsletter, resource, partner, and advertising destinations without duplicating their full content.
- [x] Add both pages to the structured content model and private editor with compiled fallbacks.
- [x] Add route-specific titles, descriptions, canonical/social metadata, structured data where appropriate, and sitemap entries.

### Header Behavior and Verification

- [x] Make each header label navigate to its hub page, using a separate menu control where needed so the dropdown remains usable with mouse, touch, and keyboard input.
- [x] Fix the overlapping-dropdown bug: when one menu has been opened by click, hovering or opening the other menu must close the first menu immediately in both the `Counties` to `Connect` and `Connect` to `Counties` directions.
- [x] Preserve clear active, hover, focus, expanded, and collapsed states on desktop and mobile.
- [x] Add regression coverage for click-to-open, hover-to-switch, focus-to-switch, outside-click, and Escape-key behavior so no two header dropdowns can remain visible at once.
- [x] Test direct navigation, dropdown links, browser history, mobile-menu behavior, keyboard navigation, analytics events, and nonexistent-route handling.
- [x] Verify both hub pages and header controls at desktop, tablet, and mobile widths with no clipping, overlap, or horizontal overflow.

Completion date: July 18, 2026

Implemented both editable, indexable hubs; split each desktop label from its dropdown control; added direct mobile hub links and a real noindex 404; and passed the 35-check rendered acceptance suite across desktop, tablet, and mobile viewports.

**Done when:** Clicking or activating either header label opens its useful hub page, both dropdowns remain accessible and functional, and the new routes are editable, indexable, responsive, and fully tested.

## 9. Rebuild Richer Community Profiles

**Goal:** Restore useful town-level context without presenting historical figures as current, reintroducing demographic targeting, adding school or safety characterizations, or repeating disclaimer copy.

Editorial direction selected by the owner on July 18, 2026: casual but professional. The owner authorized publication of the prepared copy on July 22, 2026. A complete community-image replacement and attribution pass followed on July 22, 2026.

Publication status: source blocks are supported by the structured editor, preserved by normalization, rendered accessibly, and required beside volatile community facts. Seven county introductions and all 168 current municipalities are live across 166 cards: Gloucester 24, Atlantic 23, Burlington 40, Camden 34, Cape May 16, Cumberland 14, and Salem 15. The Camden card count is lower than its municipality count because two pairs share cards.

The July 19, 2026 selective restoration connected the sourced drafts to the compiled fallbacks with a visible profile date and source notes. The original site's structured population, government, services, price, tax, school, parks, shopping/dining, and transportation fields were also restored where available. Population is labeled as 2020 Census data; volatile price, tax, and school fields are explicitly labeled as 2025 site snapshots rather than current figures. On July 22, all seven county batches were published through the production editor, then all 166 cards received locally optimized, source-verified Wikimedia Commons images with visible creator and license credits. No generated images are used in the community profiles.

### Content Work

- [x] Review the pre-remediation town narratives one community at a time and recover only objective, still-useful material.
- [x] Label retained 2025 price, tax, and school snapshots as historical rather than current; omit unsupported flood, commute, and live-market claims, and use current, dated primary sources where a time-sensitive fact genuinely helps a visitor.
- [x] Keep resident profiles, protected-class signals, subjective rankings, and unsupported performance claims out of compiled county pages and all seven county drafts, with publishing guardrails preventing their reintroduction.
- [x] Write in the approved casual-but-professional local voice and keep one concise page-level verification note instead of repeating warnings in every card.
- [x] Add citations or source notes to the structured content model where a factual claim needs ongoing maintenance.

### Verification

- [x] Review all seven draft batches for supportable factual scope, fair-housing concerns, protected-class targeting, subjective rankings, and stale-link failures. The July 19 source audit found 148 direct `2xx` responses and 28 bot-oriented `403` responses across 176 unique sources, with zero hard failures.
- [x] Recheck the 28 anti-bot-challenged sources in an interactive human browser. On July 22, 2026, every intended municipal or public-agency page rendered in Chrome without an active challenge, access-denied page, or unrelated redirect; Delran only canonicalized from `www` to its non-`www` hostname.
- [x] Replace and visually review all 166 municipality-card images, store optimized local WebP copies, and record the Commons source, creator, license, and license URL for every image. Render discreet source/license credits on each card and preserve attribution fields in the private editor.
- [x] Run the publishing guardrails, 97 unit tests, 49 tracked database checks, production build, full 51-check compliance crawl, automated accessibility checks, and desktop/mobile visual checks.
- [x] Obtain owner approval for the casual-but-professional editorial direction.
- [x] Build a local structured-content preview of all seven sourced county batches and replace the stale `Pine Hill & Pine Valley` card title.
- [x] Obtain owner approval of the actual profile drafts and full permission to replace any municipality image. The owner authorized the copy and image work on July 22, 2026.
- [x] Publish all seven approved county batches through the structured editor, verify every live card and rendered source-note count, and rerun source, accessibility, compliance, and responsive checks.

**Done when:** Every community card contains useful, human-written, supportable information without repetitive legal prose or unsupported claims.

### Deferred Concept

- Resident-submitted community photography may be considered after launch growth. It is not an active task and would need a future submission, rights-confirmation, moderation, credit, and removal workflow before publication.

## 10. Add Client Reviews to the About Page

**Goal:** Show useful public client feedback without changing the site's primary
mission as a South Jersey real-estate and community resource. Reviews remain
contained within `/about`; there is no reviews route, navigation item, or homepage
review promotion.

### Implementation

- [x] Add an editable `Client feedback` section to the existing About-page content model.
- [x] Add a no-cache Supabase `google-reviews` function that keeps the Places API key server-side and accepts only exact allowed browser origins.
- [x] Load reviews only after a visitor selects **Load Google reviews**, then expand the review cards within `/about` without navigating away or spending quota on ordinary page views.
- [x] Render Google-provided author photos, names, profile links, ratings, dates, full review text, Google Maps attribution, and a direct source link for every displayed review.
- [x] Display only returned 4- and 5-star reviews, state that selection beside the cards, preserve Google's relevance order, and link clearly to the complete Google review profile.
- [x] Add direct Google, Facebook, Zillow, and Realtor.com review-profile links and a graceful fallback when live Google data is unavailable.
- [x] Update the Privacy Policy, Terms of Service, CSP, deployment guide, and automated tests for the Google Maps content request.

### Production Setup and Verification

- [x] Enable Places API (New) in the correct Google Cloud project with billing attached.
- [x] Create an API-restricted key, resolve the stable Place ID, and save `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, and `REVIEWS_ALLOWED_ORIGINS` only as Supabase secrets.
- [x] Enforce a hard 30-request UTC daily ceiling in the Supabase backend. Places API (New) currently exposes per-method, per-minute Cloud quotas rather than a daily quota, so the private database counter provides the intended daily protection.
- [x] Deploy `google-reviews --no-verify-jwt`, then verify live author images, text, source links, filtering disclosure, CORS, CSP, timeout, quota, and unavailable-provider states.
- [x] Push the frontend, confirm GitHub tests and Cloudflare Pages deployment, and inspect `/about` at desktop and mobile widths in both themes.

Completion date: July 22, 2026

Production note: the live Google feed returns the verified Arthur Pisko Jr. listing. The site displays only returned 4- and 5-star reviews after the visitor requests them, preserves full text and attribution for any displayed card, and links visitors to the complete Google profile when Google is unavailable or no returned review meets the rating rule.

**Done when:** The production About page waits for visitor activation, expands
eligible and properly attributed Google review cards in place, links to every
review profile, fails cleanly when Google is unavailable, stays within the
configured daily ceiling, and the rest of the site remains focused on South
Jersey real estate.

## 11. Prepare the Marketing Description and Feature List

**Goal:** Maintain a reusable, factually accurate description of the complete
project, with status labels that distinguish production features from previews,
activation-ready work, paused plans, deferred concepts, and separate companion
projects.

### Project Audit and Deliverables

- [x] Review the production site, private editor, integrations, tests, project documentation, unpublished previews, and preserved roadmap work.
- [x] Separate public visitor features, private content-management features, integrations, accessibility/SEO work, privacy/security controls, operational/recovery features, and future work into clear categories.
- [x] Write one-line, short, portfolio, and extended project descriptions suitable for future marketing use.
- [x] Produce a comprehensive feature inventory using explicit `Live`, `Live - Private`, `Beta / Editorial Preview`, `Built - Activation Pending`, `Planned / Paused`, `Deferred Concept`, and `Separate Companion Project` labels.
- [x] Include the richer community profiles, Google review activation, dark-theme options, provider and advertising growth, deferred Bright IDX research, and separate weekly newsletter automation without presenting them as shipped.
- [x] Add a marketing-claim guide that identifies accurate current language and claims that must wait for a status change.
- [x] Keep private credentials, infrastructure identifiers, personal data, and secret values out of the marketing copy.
- [x] Save the finished material in [marketing-project-description.md](./marketing-project-description.md).

Completion date: July 20, 2026

Maintenance note: this is a living marketing record. Update status labels and
ready-to-use descriptions whenever a preview, activation-ready feature, or
planned item changes production status.

**Done when:** The saved document covers the whole project, includes reusable
short and long descriptions plus a categorized feature inventory, contains no
confidential information or unsupported live claims, and gives the owner clear
language to use while unfinished work remains visible as unfinished.

## 12. Add the Intended HomeBase CRM and Brokerage Links

**Goal:** Preserve the owner's earlier request to include both organizations on
the partners/provider page without mischaracterizing their ownership,
relationship, or role.

- [x] Keep the existing Real Estate Provider Directory title and navigation label, and add a separate `Partners and Vendors` section within that page.
- [x] Add HomeBase CRM using [homebasecrm.com](https://homebasecrm.com) as the destination.
- [x] State only what is supportable: HomeBase CRM is owned by Fat Cat Finance, LLC, and there is no payment or cross-ownership relationship between it and South Jersey Real Estate.
- [x] Add The Plum Real Estate Group using its [main website](https://www.theplumrealestategroup.com/) rather than a team-specific page.
- [x] Keep the brokerage affiliation clear and avoid presenting either organization as a paid placement unless that relationship changes and is disclosed.
- [x] Verify the rendered page, navigation label, responsive layout, outbound-link analytics, and directory/advertising separation before publishing.
- [x] Update [marketing-project-description.md](./marketing-project-description.md) from `Planned / Paused` to `Live` only after the production page is confirmed.

Completion date: July 22, 2026

Implementation note: `Real Estate Providers` remains the navigation label. A dedicated `Partners and Vendors` panel now identifies HomeBase CRM as a Fat Cat Finance, LLC-owned software vendor with no payment or cross-ownership relationship to South Jersey Real Estate, and identifies The Plum Real Estate Group, LLC as Arthur Pisko Jr.'s affiliated brokerage rather than a paid placement.

**Done when:** Both intended destinations appear in an accurately labeled
production section, their relationships are described truthfully, and the
marketing inventory matches the published page.

## 13. Add Optional Support SJRE Link

**Goal:** Give visitors a quiet way to support the project without implying that payment is required for the newsletter or other public content.

- [x] Add a discreet `Support SJRE` link to the site footer.
- [x] Use the website-specific Ko-fi UTM destination.
- [x] State that support is optional and the newsletter remains free.
- [x] Record consented clicks as the existing privacy-safe GA4 `outbound_click` event with `link_source: footer_support`.
- [x] Verify the exact destination, secure external-link behavior, analytics payload, accessibility, and 320-pixel layout.

Completion date: July 22, 2026

**Done when:** The production footer contains the optional support link and free-newsletter note, and a consented test click produces the expected GA4 outbound-click event without exposing URL query parameters in analytics.

## Completed Work

- [x] Rebuild the public site as a React/Vite application.
- [x] Retire the former Unraid/Caddy/legacy lead API deployment files and stop GHCR image publishing after the Pages cutover.
- [x] Add privacy controls, legal pages, accessibility improvements, and security headers.
- [x] Restore separate pages for unpaid real-estate providers and paid local-business advertising, with current provider links and concise disclosures.
- [x] Use routed `southjerseyreal.estate` email addresses in public content.
- [x] Add favicon and Apple touch icon metadata.
- [x] Remove the GitHub Actions Node 20 deprecation annotations.
- [x] Fix the iPad town-card grid and finish the wider responsive layout.
- [x] Add repository identity and push-target instructions to `AGENTS.md`.
- [x] Move production hosting to Cloudflare Pages with active apex and `www` domains.
- [x] Move contact and newsletter handling to Supabase, Turnstile, and Brevo.
- [x] Verify contact delivery and newsletter double opt-in end to end, then remove all test records.
- [x] Save the reusable Turnstile Spin workflow under `.codex/skills/turnstile-spin` for future chats.
- [x] Add 97 Vitest tests, 51 rendered-route compliance checks, and a 49-check transactional Supabase pgTAP suite, and keep the GitHub test workflow on every push.
- [x] Build and publish the private website-editor frontend, database migration, image/inbox support, managed public-content adapter, and SEO rebuild implementation while keeping production access fail-closed until provisioning is complete.
- [x] Document private inquiry access, production test cleanup, Pages recovery, retired NAS resources, and the final human compliance handoff.
