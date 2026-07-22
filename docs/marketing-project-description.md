# South Jersey Real Estate Marketing Description and Feature Inventory

Prepared: July 20, 2026

This is the reusable marketing record for `southjerseyreal.estate`. It includes
the complete project, including public features, private owner tools, beta and
preview work, activation-ready features, deferred ideas, and a related external
newsletter automation. Status labels are part of the claim: only items marked
**Live** should be presented as currently available to website visitors.

## Status Key

- **Live** - Available and working in production.
- **Live - Private** - Available in production only to the authorized site owner.
- **Beta / Editorial Preview** - Built for review or local preview, but not yet
  published as the production experience.
- **Built - Activation Pending** - Implementation exists, but an account,
  credential, deployment, quota, or final production check is still required.
- **Planned / Paused** - A documented future enhancement that has not been
  selected or completed.
- **Deferred Concept** - Preserved research for a possible future project, not
  part of the active website roadmap.
- **Separate Companion Project** - Related to the website, but intentionally
  outside this repository and its current production workflow.

## Project Facts

- **Project name:** South Jersey Real Estate
- **Website:** [southjerseyreal.estate](https://southjerseyreal.estate)
- **Project type:** Regional real-estate and community information platform
- **Coverage:** Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester,
  and Salem Counties
- **Primary focus:** South Jersey places, resources, and real-estate information
- **Personal content:** Intentionally concentrated on the About page
- **Ownership:** Personally owned by Arthur Pisko Jr.
- **Website credit:** Created and maintained by Fat Cat Finance, LLC
- **Production hosting:** Cloudflare Pages
- **Application stack:** React, TypeScript, Vite, Supabase, Cloudflare, Brevo,
  Google Analytics, and GitHub Actions

## Ready-to-Use Descriptions

### One-Line Description

South Jersey Real Estate is a regional real-estate and community information
platform covering all seven South Jersey counties, with local guides, practical
resources, secure contact and newsletter tools, and a custom owner-managed
publishing system.

### Short Description

South Jersey Real Estate is a locally focused website for learning about the
communities, geography, lifestyle, and real-estate landscape of South Jersey.
It brings together seven county guides, buyer and seller resources, regional
comparisons, a real-estate provider directory, local-business advertising
opportunities, secure inquiry and newsletter forms, and a private custom content
management system. The site is personally owned by Arthur Pisko Jr. and was
created and is maintained by Fat Cat Finance, LLC.

### Portfolio Description

South Jersey Real Estate is a custom regional publishing platform built to make
South Jersey easier to explore. The public experience covers Atlantic,
Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties while
organizing local information, real-estate resources, provider connections, and
newsletter signup into a responsive, accessible site.

Behind the public website is a purpose-built private editor for managing every
public route, publishing structured updates, optimizing images, reviewing
contact inquiries, and rebuilding search-friendly page metadata. The production
system runs on Cloudflare Pages and Supabase, uses Brevo for transactional email
and double opt-in subscriptions, and protects public forms with Cloudflare
Turnstile. Privacy-aware analytics, layered disclosures, automated testing, and
deployment recovery were treated as product features rather than afterthoughts.

The project also has a larger editorial roadmap. Sourced profiles covering all
168 current municipalities have been prepared for review, a live Google review
display is contained on the About page, and a revised dark-theme palette remains
intentionally paused. Bright MLS IDX research
is preserved separately as a deferred concept and is not represented as a live
website feature.

### Fat Cat Finance Case-Study Description

Fat Cat Finance, LLC transformed South Jersey Real Estate from a hosted
Squarespace site into a custom, owner-managed regional publishing platform. The
work included a responsive React rebuild, 21 search-ready public routes, secure
contact and double-opt-in newsletter workflows, privacy-aware analytics, a
private structured content editor and inquiry inbox, image optimization,
automated testing, and a complete migration from NAS hosting to Cloudflare Pages
and Supabase. The result is a site the owner can operate and expand without
depending on a page builder or home-server production stack.

### Extended Project Overview

South Jersey Real Estate began as a rebuild of an existing Squarespace website
and grew into a fully owned regional content platform. Its purpose is not to act
as a personal agent microsite. The main subject is South Jersey itself: its
counties, municipalities, regional identity, practical resources, and the
questions people have when considering a move or real-estate decision in the
area. Personal professional information is intentionally kept in depth on the
About page, with concise brokerage identification where visitors need it.

The public website gives visitors 21 indexable routes organized around county
exploration, regional learning, frequently asked questions, contact and
newsletter workflows, real-estate provider connections, local-business
advertising, and legal information. The navigation works across desktop, tablet,
mobile, mouse, touch, and keyboard input. Visitors can choose a persistent light
or dark theme, manage analytics consent, use protected forms, and move through
real destination pages for both Counties and Connect.

The owner does not need to edit source code to maintain the core experience. A
private single-administrator workspace at `/admin` supports structured content,
drafts, atomic publishing, image management, contact-inquiry review, and
automatic search-metadata rebuilds. Public visitors can read only published
content; private drafts, inquiry data, and privileged credentials remain outside
the browser.

The production architecture replaced the former NAS-hosted application with a
Git-connected Cloudflare Pages deployment and Supabase backend. Contact
notifications and newsletter double opt-in are delivered through Brevo, public
forms are checked server-side with Turnstile, and private data follows defined
rate-limit and retention rules. The repository includes unit, database,
accessibility, metadata, responsive, navigation, and rendered-route regression
coverage.

The site is already live, but its editorial system was designed to keep growing.
The next content layer is a sourced, casual-but-professional profile set covering
every current municipality in the seven-county region. Google review cards and
profile fallbacks are live on the About page, a new dark-theme direction can be selected
later, and the provider and advertising programs can expand as real participants
are added. A separate newsletter-content automation and a deferred Bright IDX
concept are documented without being presented as current website capabilities.

## Product Positioning

### What the Website Is

- A South Jersey-first regional information resource.
- A practical starting point for people exploring local communities or a move.
- A real-estate resource with clear paths for buyers, sellers, residents, local
  businesses, and service providers.
- A publishing platform that the owner can update without rebuilding pages by
  hand.
- A long-term foundation for richer community reporting and optional future
  integrations.

### What the Website Is Not

- It is not primarily a personal biography or agent landing page.
- It is not a brokerage website for The Plum Real Estate Group.
- It is not the HomeBase CRM product or website.
- It does not currently provide MLS or IDX property search.
- It does not currently create, publish, or send the weekly newsletter content
  automatically.
- It should not be marketed as legally certified, as a guarantee of results, or
  as a source of live market, school, tax, commute, flood, or safety data unless a
  specific published statement is dated and supported.

## Complete Feature Inventory

### Public Website and Regional Content

- **Live:** A custom React and TypeScript public website at the primary domain
  and `www` hostname.
- **Live:** 21 public routes with a real not-found experience for unknown URLs.
- **Live:** A South Jersey-focused home page with regional photography and a
  direct route into county exploration.
- **Live:** A Counties hub explaining the seven-county coverage area and linking
  to Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem
  County guides.
- **Live:** Seven individual county pages with local structure, town cards,
  supporting imagery, and compiled fallback content.
- **Live:** A Connect hub that organizes About, Contact, Newsletter, FAQ,
  regional resources, provider, and advertising destinations.
- **Live:** A Why New Jersey resource covering regional context and neighboring
  state comparisons.
- **Live:** A Why South Jersey resource covering South versus North Jersey,
  geography, culture, food, sports, transportation access, economy, and
  real-estate context.
- **Live:** A frequently asked questions page organized around buying, selling,
  contact and newsletter permissions, the provider directory, and advertising.
- **Live:** An About page that keeps the site's in-depth personal content in one
  intentional place, including local roots, professional background, buyer and
  seller work, contact options, and the reason the regional site exists.
- **Live:** Real local photography, county maps, and existing project assets
  rather than placeholder illustrations.
- **Live:** Social links to the owner's public Facebook and Instagram profiles.

### Navigation and Visitor Experience

- **Live:** Responsive desktop, tablet, and mobile layouts.
- **Live:** Separate Counties and Connect destination links plus dropdown menu
  controls.
- **Live:** Dropdown behavior for click, hover, focus, outside click, and the
  Escape key, with only one menu allowed open at a time.
- **Live:** Mobile navigation with direct access to both hubs and all major
  destinations.
- **Live:** Browser history and single-page navigation without full page reloads.
- **Live:** A persistent light and dark theme preference.
- **Live:** Clear loading, success, validation, unavailable, and empty states for
  interactive features.
- **Live:** A grouped footer with regional resources, contact destinations,
  legal pages, social links, brokerage identification, fair-housing information,
  website credit, and cookie settings.
- **Live:** Browser favicon and Apple touch icon support.

### Contact and Lead Workflows

- **Live:** A protected contact form with first name, last name, email, phone,
  topic, and message fields.
- **Live:** Inquiry topics for buying, selling, combined buy-and-sell needs,
  provider-directory questions, and local advertising.
- **Live:** Direct phone and email alternatives for visitors who do not want to
  use the form.
- **Live:** Server-side validation, bounded submissions, request timeouts,
  hidden bot traps, exact origin checks, and Cloudflare Turnstile verification.
- **Live:** Private inquiry storage with idempotency, HMAC-based rate limiting,
  delivery state, retry scheduling, and a defined 12-month retention period.
- **Live:** Transactional contact notifications delivered through Brevo to the
  routed website mailbox.
- **Live:** Scheduled notification processing and recovery from temporary email
  provider failures.
- **Live:** Contact and newsletter permissions remain separate; a contact
  inquiry does not silently create a newsletter subscription.

### Newsletter Signup

- **Live:** A dedicated newsletter page with optional name, required email,
  county interest, and primary topic interest.
- **Live:** County preferences for any of the seven counties or South Jersey as
  a whole.
- **Live:** Interest preferences for market updates, buying, selling, and local
  community information.
- **Live:** Required, versioned newsletter consent.
- **Live:** Brevo double opt-in, so a signup is not added to the audience until
  the email address confirms the request.
- **Live:** Turnstile protection, origin validation, duplicate-request handling,
  private audit records, and confirmation/error states.
- **Live:** The signup foundation can support a future newsletter that mixes
  source material while keeping audience consent and segmentation data in
  Brevo.

### Real-Estate Provider Directory

- **Live:** A dedicated unpaid real-estate provider directory, kept separate
  from paid local-business advertising.
- **Live:** Current provider entries based on public professional profiles,
  including mortgage and title or settlement categories.
- **Live:** Clear provider-choice language and direct outbound profile links.
- **Live:** A contact path for professionals interested in directory
  participation.
- **Planned / Paused:** Additional provider categories and entries can be added
  after their public facts and relationships are reviewed.
- **Planned / Paused:** HomeBase CRM may be included as a partner or vendor. It
  is owned by Fat Cat Finance, LLC; there is no payment or cross-ownership
  relationship between South Jersey Real Estate and HomeBase CRM. This entry
  should link to [homebasecrm.com](https://homebasecrm.com) and should not be
  described as live until it is confirmed on the published page.
- **Planned / Paused:** The Plum Real Estate Group may be linked through its
  [main website](https://www.theplumrealestategroup.com/) rather than a
  team-specific page. This should not be described as a current directory entry
  until it is confirmed in production.

### Local-Business Advertising

- **Live:** A dedicated page explaining paid advertising opportunities for
  South Jersey businesses outside the real-estate transaction.
- **Live:** Broad sitewide and more focused county or town placement concepts.
- **Live:** A defined placement format with business name, image, description,
  and destination link.
- **Live:** An inquiry process for eligibility, fit, placement, timing, and
  pricing discussions.
- **Live:** A requirement to label paid placements as advertisements without
  promising traffic, leads, sales, or ranking outcomes.
- **Planned / Paused:** Actual advertiser inventory and placements can be added
  as businesses participate; the program page should not be used to imply that
  paid placements already exist.

### About-Page Reviews

- **Live:** Personal review information remains contained on the About page,
  with no standalone review route, header item, or homepage review promotion.
- **Live:** The About page includes a Client Feedback section and direct links
  to public Google, Facebook, Zillow, and Realtor.com review profiles.
- **Live:** A graceful Google-profile fallback appears when the live review feed
  is unavailable.
- **Live:** A Supabase function requests Google Places review content while
  keeping the API key on the server.
- **Live:** Eligible review cards support Google's author photo,
  author name and profile, rating, date, full returned text, attribution, and
  direct source link.
- **Live:** The display preserves Google's returned order, shows only returned
  4- and 5-star reviews that fit the site's real-estate scope, states that
  selection beside the cards, and links to the complete Google profile.
- **Live:** Exact origin controls, no-cache behavior,
  request timeout, unavailable-provider fallback, and automated review tests.
- **Live:** A private Supabase counter enforces a hard 30-request UTC daily
  ceiling, and the production integration has been verified across supported
  origins, responsive layouts, and both themes.

### Privacy, Consent, and Public Disclosures

- **Live:** A privacy banner that leaves optional Google Analytics disabled until
  the visitor accepts it.
- **Live:** Accept, decline, and reopen-cookie-settings controls.
- **Live:** Analytics withdrawal removes the loader and relevant cookies before
  returning the visitor to a denied-consent runtime.
- **Live:** Privacy Policy, Terms of Service, and Disclaimer pages.
- **Live:** Concise sitewide brokerage, license, fair-housing, and Equal Housing
  Opportunity information backed by one structured source of verified facts.
- **Live:** More detailed explanations are placed on relevant legal or resource
  pages instead of interrupting ordinary editorial content.
- **Live:** Provider-directory and paid-advertising disclosures keep those two
  programs distinct.
- **Live:** Form notices explain the purpose of the submission and preserve a
  separate newsletter consent decision.
- **Live:** A documented quarterly review process for licenses, office facts,
  credentials, trackers, provider relationships, and public claims.
- **Important marketing limit:** These controls support responsible operation,
  but the website should not be advertised as independently legally certified.

### Accessibility and Inclusive Interaction

- **Live:** Semantic page landmarks, headings, navigation, labels, and a skip
  link.
- **Live:** Keyboard-accessible menus, buttons, forms, dialogs, and expandable
  content.
- **Live:** Visible focus states and Escape-key behavior for menus and privacy
  controls.
- **Live:** Accessible success, error, loading, and status announcements.
- **Live:** Required alternative text for published editorial images.
- **Live:** Responsive disclosure and content readability down to narrow mobile
  widths, with automated overflow checks.
- **Live:** Automated axe checks against representative routes using WCAG 2.0,
  2.1, and 2.2 AA rules.
- **Important marketing limit:** Automated checks and deliberate accessible
  design should be described as accessibility work, not as a guarantee that no
  accessibility issue can ever exist.

### Search, Sharing, and Discoverability

- **Live:** Route-specific page titles and descriptions for all 21 public routes.
- **Live:** Canonical URLs and canonical host redirects.
- **Live:** Open Graph and Twitter sharing metadata with image dimensions and
  alternative text.
- **Live:** JSON-LD structured data and hierarchical breadcrumb data where
  appropriate.
- **Live:** A generated XML sitemap with truthful route modification dates.
- **Live:** Search-engine instructions through `robots.txt` and page-level robots
  metadata.
- **Live:** Crawler-readable prerendered headings, summaries, related-page links,
  footer identity, and structured data even before the React application loads.
- **Live:** The private editor and true 404 page are deliberately excluded from
  indexing and canonical structured data.
- **Live:** Publishing through the private editor can trigger a protected
  Cloudflare rebuild so updated titles, descriptions, content, social metadata,
  structured data, and sitemap output become crawler-visible.
- **Live:** Google Search Console has confirmed that the production URL is
  crawlable and eligible for indexing.

### Analytics and Measurement

- **Live:** Consent-gated Google Analytics 4 on the exact canonical production
  hostname.
- **Live:** Manual single-page `page_view` events with duplicate suppression and
  the prior virtual URL used as the referrer.
- **Live:** Privacy-safe navigation, internal-link, outbound-link, telephone, and
  email interaction events without raw contact values or arbitrary URL details.
- **Live:** Successful contact submissions record the recommended
  `generate_lead` event and a direct `contact_lead` key event.
- **Live:** Successful newsletter subscriptions record a separate `sign_up`
  event rather than being counted as contact leads.
- **Live:** Low-cardinality event dimensions for form name, lead type, and link
  source.
- **Live:** Production event collection and lead-key-event configuration have
  been verified; a controlled-browser DebugView attachment limitation is
  documented separately and is not treated as evidence of failed collection.

### Private Content Management System

- **Live - Private:** A custom single-administrator workspace at `/admin`.
- **Live - Private:** Password, magic-link, invitation, recovery, session refresh,
  sign-out, unauthorized, and fail-closed configuration states.
- **Live - Private:** Public signup disabled and access bound to one approved
  account UUID.
- **Live - Private:** Structured editing for sitewide navigation, footer, privacy
  content, and all 21 public routes.
- **Live - Private:** Recursive field editing for page content, links, cards,
  comparison sections, resource sections, and source notes within the supported
  page structure.
- **Live - Private:** Add, remove, and reorder supported repeating content items.
- **Live - Private:** Unsaved, saved-draft, and published status indicators.
- **Live - Private:** Private draft saves that do not alter the public website.
- **Live - Private:** Atomic publishing and discard-to-published controls.
- **Live - Private:** Optimistic concurrency protection that stops an older tab
  from overwriting a newer edit.
- **Live - Private:** Link validation, image-alt validation, and publishing
  guardrails for unsupported or sensitive community claims.
- **Live - Private:** JPG, PNG, WebP, and AVIF uploads with file-size and decoded
  dimension limits.
- **Live - Private:** Client-side image optimization into separate full-size and
  editor-friendly WebP variants.
- **Live - Private:** Image replacement, removal, storage cleanup, and cleanup
  warnings.
- **Live - Private:** A paginated contact-inquiry inbox showing the submitted
  contact details, topic, message, source page, notification status, and retention
  date only to the authorized owner.
- **Live - Private:** Refresh and load-more controls with stable cursor-based
  pagination.
- **Live - Private:** Authenticated publishing can request a protected Cloudflare
  Pages rebuild without exposing the deployment hook to the browser.
- **Live - Private:** The editor is responsive and explicitly excluded from
  search indexing and caching.

### Backend, Security, and Data Handling

- **Live:** Supabase Postgres, Auth, Storage, Edge Functions, row-level security,
  and database functions support the production site.
- **Live:** Public browsers receive only the browser-safe Supabase publishable
  key; privileged service credentials stay server-side.
- **Live:** Anonymous users can read published content but cannot read drafts,
  private inquiry data, administrator records, or protected image-management
  operations.
- **Live:** Contact and newsletter endpoints enforce exact production-origin
  allowlists and narrowly defined CORS behavior.
- **Live:** Turnstile tokens are validated server-side for the expected action
  and hostname.
- **Live:** Request bodies, field lengths, link formats, image types, and image
  dimensions are bounded and validated.
- **Live:** Rate-limit identifiers are stored as keyed hashes; raw client IP
  addresses are not stored in the form database.
- **Live:** Contact and newsletter audit data has defined expiration behavior,
  with rate-limit records retained only briefly and form records retained for 12
  months.
- **Live:** Scheduled jobs process contact notifications and purge expired data.
- **Live:** Security headers include content restrictions, transport security,
  frame protection, referrer limits, permissions controls, and mixed-content
  upgrades.
- **Live:** Public review requests use a server-held provider key, exact origins,
  no-store responses, and timeouts once the feature is activated.

### Hosting, Deployment, and Recovery

- **Live:** The public frontend is hosted entirely on Cloudflare Pages and no
  longer requires the former Unraid application container or NAS-hosted web
  stack.
- **Live:** The apex domain, `www`, SSL, redirects, SPA routing, and security
  headers are managed through Cloudflare.
- **Live:** Git pushes to the production branch trigger the Cloudflare Pages
  build and deployment workflow.
- **Live:** Supabase hosts form handling, protected data, authentication, images,
  scheduled work, the content database, and Edge Functions.
- **Live:** Brevo handles transactional contact notifications and newsletter
  double opt-in; Cloudflare Email Routing handles the domain's inbound routing.
- **Live:** A protected deploy hook lets approved content publishing trigger a
  crawler-visible frontend rebuild.
- **Live:** Recovery uses a known-good Git revision or Cloudflare Pages
  deployment plus forward-only database migrations.
- **Live:** Docker remains useful only for the local Supabase database test
  stack; it is not required to serve the production website.
- **Live:** The obsolete Caddy, legacy lead API, GHCR image publishing, and
  website-specific Unraid container path have been retired.

### Quality Assurance and Maintainability

- **Live:** A typed React and TypeScript component architecture with structured
  content separated from reusable layouts.
- **Live:** Compiled fallback content keeps the public site usable if remote
  published content is temporarily unavailable.
- **Live:** 92 unit and component checks cover frontend behavior, forms, content,
  editor workflows, analytics, review handling, and Edge Function helpers.
- **Live:** 49 transactional database checks cover private access, rate limits,
  retention, notification lifecycle, publishing, concurrency, and inbox
  pagination.
- **Live:** 37 rendered browser checks cover all 21 public routes plus metadata,
  navigation behavior, responsive layouts, screenshots, accessibility, and
  non-indexable special routes.
- **Live:** Deno formatting and type checks cover Supabase Edge Functions.
- **Live:** GitHub Actions runs the automated test workflow on repository
  updates.
- **Live:** Production checks have included desktop, tablet, and mobile widths,
  keyboard navigation, horizontal-overflow checks, and test-data cleanup.
- **Live:** Repository guidance records the correct project identity, production
  branch, push target, deployment expectations, and secret-handling boundaries
  for future Codex work.

## Beta and Editorial Preview

### Rich Community Profiles

- **Beta / Editorial Preview:** Seven casual-but-professional county
  introductions have been drafted from government and public-agency sources.
- **Beta / Editorial Preview:** All 168 current municipalities across the seven
  counties are represented in 166 profile cards; two Camden County pairs share
  combined cards.
- **Beta / Editorial Preview:** The local structured preview can restore sourced
  population, government, service, housing-price, tax, school, park,
  shopping/dining, and transportation fields where support exists.
- **Beta / Editorial Preview:** Population is labeled as 2020 Census data, while
  retained price, tax, and school values are labeled as 2025 website snapshots
  rather than current live figures.
- **Beta / Editorial Preview:** Source notes are part of the structured content
  model and render beside claims that need ongoing maintenance.
- **Beta / Editorial Preview:** Expandable profile controls are keyboard and
  screen-reader accessible.
- **Beta / Editorial Preview:** Publishing guardrails exclude resident profiling,
  protected-class targeting, unsupported rankings, school or safety
  characterizations, and unsupported current-market claims.
- **Beta / Editorial Preview:** The latest automated source pass found 148 direct
  successful responses, 28 anti-bot challenge responses, and no hard source
  failures across 176 unique sources.
- **Before publication:** The 28 challenged sources need interactive review,
  every municipality image needs owner verification, actual copy and images need
  owner approval, county batches need to be published through the editor, and
  the rendered source, accessibility, compliance, and responsive checks need to
  be rerun after each batch.

## Planned and Paused Enhancements

### Dark Theme Palette Refresh

- **Live today:** The site already has functional light and dark themes with a
  remembered visitor preference.
- **Planned / Paused:** A visual audit identified better surface hierarchy and
  clearer semantic color roles as the next dark-theme improvement.
- **Planned / Paused:** Three contrast-tested directions exist: Pine and Gold,
  Atlantic Signal, and Cranberry and Sea Glass.
- **Planned / Paused:** An interactive comparison and desktop/mobile reference
  screenshots are already prepared for the final visual decision.
- **Planned / Paused:** Pine and Gold is the documented starting recommendation,
  but the owner has intentionally left the current palette unchanged.
- **Before publication:** Select a direction, map colors to semantic tokens,
  apply and review every relevant surface and state, verify photography and
  focus/validation states, run desktop/tablet/mobile and accessibility checks,
  and obtain visual approval.

### Provider and Advertising Growth

- **Planned / Paused:** Expand the unpaid provider directory after current public
  facts and relationship disclosures are reviewed.
- **Planned / Paused:** Confirm and publish the intended HomeBase CRM and The Plum
  Real Estate Group links if they remain appropriate to the directory's final
  scope.
- **Planned / Paused:** Add real paid local-business placements only after fit,
  labeling, creative, destination, timing, and terms are agreed.

## Deferred Concept: Bright MLS IDX

Bright MLS IDX is preserved as research for a possible separate future project.
It is not part of the active `southjerseyreal.estate` roadmap and is not a live
or promised website feature.

- **Deferred Concept:** A broad Bright-approved IDX search across permitted MLS
  inventory on a future selected domain.
- **Deferred Concept:** A possible office-ID-filtered view showing only a
  brokerage's listings.
- **Deferred Concept:** A decision between active-only listings and additional
  IDX-permitted statuses.
- **Deferred Concept:** Vendor-supported search, filters, results, listing detail
  pages, maps, saved searches, lead routing, mobile behavior, accessibility, SEO,
  and branding controls.
- **Deferred Concept:** Bright-required attribution, listing-broker identity,
  disclaimers, refresh schedules, usage reporting, and prompt removal of expired
  or ineligible listings.
- **Required before any implementation:** Select the project and domain, obtain
  broker approval, determine whether personal and brokerage sites need separate
  approvals or subscriptions, obtain the office ID for a brokerage-only view,
  choose a Bright-approved vendor, confirm costs, and complete current Bright,
  vendor, legal, attribution, and display-rule review.
- **Non-negotiable:** Listing data must not be scraped or manually republished.

## Separate Companion Project: Weekly Newsletter Automation

This planned workflow is related to the website audience but is intentionally a
separate project or automation. It is not currently a feature of the public site
or the private website editor.

- **Separate Companion Project:** Search the owner's inbox for a designated tag
  on a weekly schedule.
- **Separate Companion Project:** Use ChatGPT and the selected source messages to
  draft a weekly South Jersey newsletter.
- **Separate Companion Project:** Generate supporting images for the edition.
- **Separate Companion Project:** Save the finished copy and images into the
  designated Google Drive folder.
- **Separate Companion Project:** Preserve source tracking and support future
  audience segmentation, template preparation, test sends, and campaign launch.
- **Connection to the website:** The live website already collects explicit,
  double-opt-in newsletter subscriptions and preference fields in Brevo, so the
  separate content workflow can eventually prepare campaigns for that consented
  audience.
- **Not currently included:** Automatic transfer from Google Drive into the site,
  automatic publishing, automatic Brevo campaign creation, or automatic sending
  should not be claimed until that separate automation is built and tested.

## Technology and Integration Summary

- **Frontend:** React 19, TypeScript, Vite 7, reusable layouts, structured
  content adapters, and Lucide icons.
- **Hosting and edge:** Cloudflare Pages, DNS, SSL, redirects, security headers,
  Turnstile, and Email Routing.
- **Backend:** Supabase Postgres, Auth, Storage, Edge Functions, row-level
  security, database RPCs, scheduled jobs, and Vault-backed configuration.
- **Email and audience:** Brevo transactional email and newsletter double opt-in.
- **Analytics and search:** Google Analytics 4 and Google Search Console.
- **Automation and delivery:** GitHub Actions, Git-connected Cloudflare builds,
  protected content-publishing rebuild hooks, and scripted SEO prerendering.
- **Testing:** Vitest, Testing Library, Playwright, axe-core, Supabase pgTAP, and
  Deno formatting/type checks.
- **Local-only tooling:** Docker for the Supabase test stack; it is not a
  production website dependency.

## Marketing Claim Guide

### Safe Current Claims

- “A live South Jersey real-estate and community information platform.”
- “Coverage across all seven South Jersey counties.”
- “21 public resource, county, connection, and legal routes.”
- “Responsive light and dark experiences for desktop, tablet, and mobile.”
- “Secure contact and double-opt-in newsletter workflows.”
- “A custom private content-management and inquiry workspace.”
- “Built with structured content, route-specific SEO, privacy-aware analytics,
  accessibility testing, and automated deployment.”
- “Production hosting no longer depends on a home server or NAS container.”
- “Sourced profiles for all 168 current municipalities are in editorial preview.”
- “The About page can display eligible, fully attributed Google review cards and links to the complete public profile.”
- “Future IDX research has been documented separately and is not currently
  available.”

### Claims to Avoid Until Status Changes

- “Browse all Bright MLS listings” or “live MLS search.”
- “All 168 municipality profiles are live.”
- “The website automatically writes or sends a weekly newsletter.”
- “Paid advertisers are featured” until actual labeled placements exist.
- “HomeBase CRM and The Plum Real Estate Group are current partners” until both
  intended entries are confirmed on the published provider page.
- “Real-time market data,” “current taxes,” “current school performance,” or
  similarly time-sensitive claims unless the displayed source and date support
  the exact statement.
- “Guaranteed leads,” “guaranteed traffic,” “best communities,” “safe areas,” or
  subjective ranking language.
- “Fully compliant,” “legally certified,” “ADA certified,” or any equivalent
  absolute assurance.

## Maintenance Checklist

Update this document whenever a feature changes status:

1. Confirm the feature in the production site or private production workflow.
2. Change its status label in this inventory.
3. Update the ready-to-use descriptions if the change affects public positioning.
4. Remove the old limitation from the claim guide only after production
   verification.
5. Keep private credentials, account identifiers, internal project references,
   lead data, and secret values out of marketing materials.
