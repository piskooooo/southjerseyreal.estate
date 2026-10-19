# South Jersey Real Estate Project Checklist

Last reviewed: October 19, 2026

**Roadmap status: Complete.** The selected roadmap closed on August 7, 2026.
The owner separately selected the September 4 audit corrections below. Their
implementation, preview delivery verification, and production release are
complete. Routine maintenance, quarterly reviews, marketing campaigns,
and explicitly deferred concepts are not unfinished roadmap work and must not
be reported as active unless the owner explicitly selects them.

The owner selected community-interest measurement on October 16. Its
implementation, production verification, and GA4 reporting-field setup are
complete. The accompanying traffic/SEO review is recorded below. The original
roadmap remains closed.

Use this file as the source of truth for project status and any future selected
work on `southjerseyreal.estate`. Check an item only after completing its
**Done when** test. Never place passwords, SMTP credentials, webhook URLs, lead
data, or other secrets in this file.

## Completed Roadmap

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
- [x] 14. Add an evergreen Insights section
- [x] 15. Finish the Google Business Profile ownership handoff and detail review
- [x] 16. Obtain broker confirmation for current provider relationships

All selected roadmap items are complete. Earlier loose ideas about a statewide
referral strategy, additional backup/export work, and other chat-only
possibilities are intentionally not being carried forward.

## Owner-selected October 16 Community-interest Measurement

- [x] Add consent-gated `community_profile_open` events using reviewed public
  county/town identifiers resolved from stable section IDs. Distinguish manual
  openings from anchor navigation, deduplicate within a county-page visit,
  and exclude bulk controls and replay of activity before opt-in.
- [x] Attach the last-opened town to contact-page clicks, approved agent/office
  phone and agent-email clicks, and successful contact events. Keep this
  context in memory only, expire it after 30 minutes without tracked activity,
  clear it on consent withdrawal, and leave form requests/storage unchanged.
- [x] Verify the source implementation: 176 unit tests, the production build,
  and 82 rendered browser/compliance checks, including all seven county
  guides, mobile contact navigation, shared anchors, content refresh, theme
  changes, and consent behavior. The browser run used `CI=1` with the installed
  bundled Chromium because the configured desktop Chrome executable was
  absent. `git diff --check` passed. No real inquiry was submitted for this
  browser-event-only change; existing form and Turnstile behavior is unchanged.
- [x] Register the three event-scoped GA4 custom dimensions: County
  (`county_id`), Town (`community_id`), and Profile open method (`open_method`).
  On October 16, the authenticated Admin API independently listed all three
  exact definitions on property `498019272`; its plan skipped all three as
  already present. No duplicate dimensions were created. The dedicated CLI
  service account has Viewer access only on this property; connector writes
  remain disabled. Normal report population is not yet verified.
- [x] Publish the source and verify production. Commit `e003c1f` is on
  `origin/main`; the [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/38981605083)
  and [Cloudflare Pages deployment](https://a9b8f080.southjerseyreal-estate.pages.dev)
  succeeded for the exact revision. Production serves the new tracking bundle
  on the canonical hostname. A controlled browser check used explicit
  `codex_test / qa` campaign attribution and confirmed Google `204` responses
  for a Camden City profile opening and a subsequent Contact click with the
  expected county/town parameters under `G-97H86MNHP8`. No contact inquiry or
  newsletter subscription was submitted.

The owner authorized production publication and GA4 setup on October 16.
Production tracking is active, event receipt is verified, and the three GA4
custom dimensions are independently verified. The GA4 setup was completed
after the website release; no further frontend deployment was needed.
Normal reporting is not claimed as populated.
The measurement contract, reporting setup, and interpretation limits are in
[the deployment guide](cloudflare-pages-supabase-brevo.md#community-interest-analytics).

- [x] Complete the selected Camden/Atlantic traffic and SEO review using
  connected GA4/Search Console and the current public pages. The
  [October 16 review](analytics-town-attribution-review-2026-10-16.md) records
  the measured baseline, QA contamination, attribution limits, and prioritized
  improvements with acceptance measures. The owner subsequently selected
  recommendations 1–4 below. On October 17, the owner expanded the wording
  correction into a rewrite of all 166 town introductions.

## Owner-selected October 16 County Initial Content

The owner selected only recommendation 1 from the traffic/SEO review:
include existing town content in the initial county-page HTML.

- [x] Render every current town heading, full summary, and dated source note
  from the accepted structured page content before JavaScript. Share town
  classification, keys, readable anchors, source URL normalization, and the
  community-information note with the interactive page. Preserve published
  edits, order, and removals; omit historical detail paragraphs and imagery
  from this text fallback.
- [x] Complete local unit, build, rendered/compliance, no-JavaScript, and
  desktop/mobile checks. Verify all 166 compiled profiles across seven
  counties, including 34 Camden and 23 Atlantic profiles, and preserve the
  existing interactive expansion, consent, and town-attribution behavior.
  All 181 unit tests and 93 rendered browser/compliance checks passed. The
  latter includes the production build using offline test fixtures. Additional
  1440 × 1000 desktop and 390 × 844 mobile preview checks found no console
  errors, framework overlay, or horizontal overflow. A no-JavaScript anchor
  check also verifies town headings clear the sticky header. `git diff --check`
  passed. Browser validation used the installed bundled Chromium with `CI=1`;
  the Browser plugin is not available in this session.
- [x] Publish the owner-authorized release and verify the exact revision's
  GitHub tests, Cloudflare Pages deployment, and live county HTML/profile
  behavior. Implementation commit `547bc43` is on `origin/main`; the
  [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/38995350025)
  and [Cloudflare production deployment](https://2540faa6.southjerseyreal-estate.pages.dev)
  succeeded for that exact revision. The configured production build
  completed successfully, including published-content prerendering.

The owner-authorized production release completed October 16. Independent
canonical HTTP checks found all 166 profiles across seven counties with full
summaries, dated HTTPS source links, unique anchors, and correct metadata.
Production browser checks confirmed Camden's 34 and Atlantic's 23 initial
profiles match the actual published content fetched by the interactive app;
shared town links, no-JavaScript access, and manual expansion/collapse work
without duplicate fallback content, horizontal overflow, or Google Analytics
requests while consent is denied. No inquiry or subscription was submitted.
A separate external Cloudflare analytics beacon failed DNS resolution from
the test Mac; no first-party page/runtime failure was found. This does not
claim that external beacon delivery was verified. The original roadmap
remains closed. The owner subsequently selected the town directory, guide
links, and town introduction rewrite recorded below.

## Owner-selected October 16 Town Directory

The owner selected the town directory from recommendation 2 in the traffic/SEO
review, with an explicit requirement to preserve the site's existing aesthetic.
After reviewing the preview, the owner chose to omit the copy-link action.
The owner also requested that the county controls remain visible while
scrolling through the town list.

- [x] Add a compact, closed-by-default `Jump to a town` directory to each
  county toolbar, using the existing town order and anchors. Provide the same
  native links in the initial HTML. Keep the approved typography, square
  controls, imagery, and light/Midnight Editorial color palettes.
- [x] Pin the county controls directly below the site header once they reach
  it, using measured header/toolbar heights that adjust to mobile wrapping.
  Keep town destinations clear of both bars, bound the dropdown to the
  remaining viewport, and let the controls leave with the town section.
- [x] Remove the preview's `Copy town link` action, clipboard component, and
  associated styles and tests at the owner's request. Retain working town
  fragments in the browser address when a visitor selects a directory entry.
- [x] Finish local unit, build, browser/compliance, accessibility, and
  desktop/mobile visual verification, including directory order, keyboard
  focus, repeated jumps, Back/Forward, absence of copy controls, and consent.
  The final directory-only revision passed all 181 unit tests and 106
  rendered browser/compliance checks,
  including the build with offline content fixtures. The browser run used
  `CI=1` and the installed bundled Chromium; the Browser plugin is unavailable.
  Directory previews at 1440, 768, 390, and 320 pixels covered both themes,
  open menus, and expanded profiles with no page errors or horizontal
  overflow. Targeted WCAG checks found no violations in the open directory.
  Desktop and mobile screenshots were refreshed after removing the copy
  control, and browser assertions verify its absence after expansion.
  A pre-existing tablet cascade issue was corrected by keeping the editorial
  town list in one column; regression checks cover 768, 820, and 980 pixels.
  Sticky-control checks cover normal flow, header alignment, both themes,
  dropdown bounds, bulk controls, section-boundary release, and mobile resize
  with Back/Forward navigation. Explicit anchor alignment keeps restored town
  headings below both bars. Additional 1440 × 1000, 390 × 844, 320 × 568, and
  844 × 390 previews verified fresh links, keyboard focus, open-menu WCAG
  checks, and no page errors or horizontal overflow.
  `git diff --check` passed. No inquiry or subscription was submitted.
- [x] Publish the owner-authorized release, then verify GitHub tests,
  Cloudflare Pages deployment, and live directory behavior. Implementation
  commit `dda34f2` is on `origin/main`; the
  [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/38999352132)
  and [Cloudflare production deployment](https://7f814028.southjerseyreal-estate.pages.dev)
  succeeded for that exact revision.

The owner authorized committing and pushing this selected follow-up on
October 16, and production verification completed the same day. All seven
county pages serve 166 matching, ordered native town links before JavaScript.
Live Camden desktop/light and Atlantic mobile/dark checks confirmed real
published-content responses, sticky navigation, clear town headings,
Back/Forward, bulk controls, no copy action, no page errors or horizontal
overflow, and no Google Analytics requests with consent denied. No inquiry
or subscription was submitted. The original roadmap remains complete.
The owner subsequently selected the county guide links and town introduction
rewrite below.

## Owner-selected October 16 County Guide Links

The owner selected recommendation 3 from the traffic/SEO review: discreet
links from Camden and Atlantic County introductions to relevant existing
Insights articles, preserving the current aesthetic.

- [x] Add seller-preparation and municipal-records links to Camden and a
  coastal-property due-diligence link to Atlantic as small underlined text.
  Keep the existing guidance buttons, county writing, source notes, imagery,
  and all other county content intact.
- [x] Keep the links in editable structured blocks and include their real
  destinations in initial HTML. Upgrade older published content once without
  duplicating links or restoring later owner removals; hide the internal
  version marker from the editor.
- [x] Complete unit, build, browser/compliance, initial-HTML, analytics,
  accessibility, and desktop/mobile verification. All 185 unit tests and
  110 browser/compliance checks passed, including the production build with
  offline fixtures. The new checks cover real initial-HTML destinations,
  no-JavaScript and interactive article navigation, unchanged guidance
  buttons, consented link events without town context or conversions, and
  no analytics when consent is denied. Additional preview checks at
  1440 pixels in both themes and 390/320 pixels in dark mode found no page
  errors, horizontal overflow, or accessibility violations in the modified
  introductions and adjacent guidance sections. Guide links have visible
  keyboard focus. Visual review and `git diff --check` passed. Browser
  validation used bundled Chromium because the Browser plugin is unavailable.
- [x] Publish the owner-authorized release, then verify GitHub tests,
  Cloudflare Pages deployment, and live guide navigation. Implementation
  commit `850b420` is on `origin/main`; the
  [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/39002711990)
  and [Cloudflare production deployment](https://7e3626e3.southjerseyreal-estate.pages.dev)
  succeeded for that exact revision, including the production build with
  published-content prerendering.

The owner approved the preview and authorized committing and pushing on
October 17. Production verification completed the same day: all three guide
links are present in the initial county HTML and open the correct articles
without JavaScript. Live Camden desktop/light and Atlantic mobile/dark checks
confirmed real published-content responses, the new quiet link styling,
unchanged guidance buttons, and working article navigation, with no page
errors, horizontal overflow, failed requests, or Google Analytics requests
while consent is denied. No inquiry or subscription was submitted.
The owner subsequently selected the town introduction rewrite below. The
original roadmap remains closed.

## Owner-selected October 17 Town Introductions

The owner selected recommendation 4 and explicitly expanded it to all 166
town introductions across the seven counties. The earlier summaries repeated
the expanded parks, shopping, and transportation fields rather than introducing
the places themselves.

- [x] Replace all 166 checklist summaries with concise, distinct introductions
  grounded in the towns' geography, settlement patterns, history, and physical
  landmarks. Research each factual claim in a supporting primary source and
  retain dated source notes. Avoid generic marketing, demographic targeting,
  school or safety rankings, commute promises, and current market claims.
- [x] Preserve the design, card order, anchors, imagery, source attribution,
  and clearly dated expanded detail snapshots. Keep the reviewed prose in
  the editable structured content and its source document.
- [x] Upgrade unchanged older published summaries and their source notes
  without overwriting owner-written text, restoring removed cards, or
  reversing later edits. Verify the same prose in initial HTML and the
  interactive page.
- [x] Complete editorial, source, unit, production-build, browser/compliance,
  and desktop/mobile verification. All 188 unit tests and 117 browser checks
  passed, including the local production build with offline fixtures. The
  new browser checks exercise older published documents for all seven
  counties. A separate read-only capture of the real published county rows
  confirmed all 166 old summaries match the guarded baseline; SSR and
  browser checks then verified that all 166 upgrade to the reviewed prose
  without changing any expanded historical paragraphs. Initial HTML,
  source dates, anchors, directory/history behavior, and consent checks pass.
  Additional 1440-pixel light/dark, 390-pixel dark, and 320-pixel light
  previews passed visual and targeted accessibility review, with no page
  errors or horizontal overflow. Browser validation used bundled Chromium
  because the Browser plugin is unavailable. `git diff --check` passed.
  The owner reviewed the local preview; no form was submitted.
- [x] Publish the owner-authorized release and verify the GitHub checks,
  Cloudflare deployment, and live town introductions. Implementation commit
  `18b76b55ddb4358c67c0ff0323038c7f55bb1612` passed the
  [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/39041215196)
  with 188 unit tests, the Edge Function checks, and 117 browser checks.
  [Cloudflare deployment `3c11f41a`](https://3c11f41a.southjerseyreal-estate.pages.dev)
  succeeded for the exact commit and became the canonical production release.

The owner approved the preview and authorized committing and pushing on
October 17. Production verification completed the same day: all seven county
routes returned 200 and contained all 166 reviewed introductions in their
initial HTML and hydrated pages, with dated supporting source notes. The real
published-content responses returned 200. All 1,439 historical non-source detail
blocks matched the pre-release public documents and rendered unchanged.
Expand/collapse controls and directory jumps passed on every county route.
Desktop/mobile checks in both themes found no page or console errors,
horizontal overflow, or analytics events or requests with consent denied.
Targeted accessibility checks found no violations and visual review confirmed
the existing styling. No inquiry or subscription was submitted.
The original roadmap remains complete.

## Owner-selected October 17 Town Finder

The owner selected the first proposed improvement: a discreet town-name finder
on the Counties page. The owner subsequently selected the county-description
rewrites and guide contact links recorded below.

- [x] Add a small search field above the existing county directory, using the
  current typography, square controls, and approved light/dark colors.
- [x] Match town names across all seven counties and show county labels for
  similarly named places. Link directly to existing county-page town anchors.
- [x] Build the finder from accepted current county content, respecting changed
  headings and removed cards. Load the county documents in one request without
  sending search text to the server or adding search-query analytics.
- [x] Verify keyboard navigation, ordinary and modified links, empty results,
  cleared searches, edited content, mobile layout, and existing navigation.
  Run the unit tests, production build, and full browser/compliance checks,
  then make the preview available for owner review.

All 214 unit tests and 122 browser/compliance checks passed, including the
production build with offline fixtures. New browser cases verify cross-county
destinations, county disambiguation, keyboard focus, mobile layout, local-only
queries, delayed content, owner renames/removals, and native new-tab links with
accepted analytics. The search status remains available to assistive technology
when cleared. Ordinary page views remain immediate; unresolved town fragments
wait for content validation, and early events clean unsafe URL query values
before analytics can initialize.

Additional preview checks used current public county content at 1440 pixels in
both themes, 390 pixels in dark mode, and 320 pixels in light mode. Screenshots
were reviewed, with no page errors, horizontal overflow, or settled-theme
accessibility violations in the finder. The Browser plugin is unavailable;
validation used the repository's installed Playwright Chromium. No form or
subscription was submitted, and no production content was written.

Implementation and local verification are complete. The preview is available
at `http://localhost:4175/counties`. A final production-preview build reused only
the Supabase configuration already visible on the public website, without
writing an environment file. Its real published-content request returned 200
with all seven county documents; lookups from each county passed, and the
Merchantville result opened, expanded, and received focus. No page errors,
overflow, or denied-consent analytics events occurred. The owner approved the
preview and authorized committing and pushing on October 17. The production
release was verified the same day:

- Implementation commit `0426c6d8c8920806ae6f23f07387a381c07f2b11` passed the
  [GitHub test workflow](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/39059818260):
  214 unit tests, the Edge Function checks, and 122 browser/compliance checks.
- [Cloudflare deployment `510db7d9`](https://510db7d9.southjerseyreal-estate.pages.dev)
  succeeded for the exact commit and became the canonical/latest production
  deployment, with all five stages successful.
- Canonical `/counties` and its actual published-content request returned 200.
  The request included the expected nine keys and returned seven published
  county rows. All 166 normalized destinations were findable by exact name in
  the live finder; those 166 searches made only the initial content request.
- Seven-county examples, duplicate Washington labels, clear/empty-result states,
  the eight-result limit, keyboard activation, and a native Merchantville new
  tab passed. Merchantville and Bass River destinations expanded and received
  focus. Desktop at 1440 pixels in both themes, mobile at 390 pixels in light
  mode, and mobile at 320 pixels in dark mode had no page/console errors,
  horizontal overflow, query transmissions, or denied-consent analytics events
  or requests. Targeted accessibility checks found no violations; inspected
  screenshots retained the editorial design. Live smoke testing used Chromium.

No form or subscription was submitted and no production content was written.
The original roadmap remains complete.

## Owner-selected October 17 County Directory Descriptions

The owner selected distinct descriptions for the seven county cards on the
Counties page, with the explicit requirement to keep the existing look.

- [x] Replace the repeated generic sentence with concise geographic descriptions
  and recognizable communities, using existing county writing and checked
  primary sources. Record the wording and references in
  [the community writing record](community-profile-drafts.md#county-directory-descriptions).
- [x] Preserve the maps, card order, typography, styles, county destinations,
  town finder, and full county-page introductions. Upgrade only exact legacy
  paragraphs on matching stored county cards, preserving custom wording,
  removed cards/paragraphs, and owner ordering.
- [x] Complete the existing unit and browser/compliance checks and inspect the
  Counties page on desktop/mobile in both themes. Make the local preview
  available for owner review.

All 215 unit tests and 122 browser/compliance checks passed, including the
production build and prerendering. The compatibility test verifies owner
changes, removals, ordering, input immutability, and repeat normalization.
Additional browser checks at 1440 pixels in both themes, 390 pixels in light
mode, and 320 pixels in dark mode found all seven maps loaded, no clipped
paragraphs, no horizontal overflow, no page/console errors, and no targeted
accessibility violations. County links opened the correct pages. Screenshots
retain the current card design; no layout, stylesheet, or component changes
were needed. The Browser plugin is unavailable, so validation used the
repository's installed Playwright Chromium.

The production-style local preview at `http://localhost:4175/counties` was
rebuilt with the existing public browser configuration. Its real published
content request returned 200, all seven new descriptions rendered, and the
Merchantville finder result opened and focused the expected town profile.
The stylesheet hash is unchanged. No inquiry/subscription was submitted and
no production content was written.

This selection covers the seven hub descriptions. Implementation and local
verification are complete. The owner approved the preview and authorized
committing and pushing the work on October 17. The original roadmap remains
complete.

## Owner-selected October 17 Guide Contact Links

The owner selected a discreet contact link in the existing Related next steps
area of the six research guides, preserving their current look.

- [x] Append `Discuss your home search` linking to `/contact` in the property
  research, home inspection, municipal records, community research, coastal
  due diligence, and wells/septic/acreage guides. Retain their two reading
  links and the existing buyer/seller guide contact links.
- [x] Upgrade older saved guide content once, preserving custom links and their
  order, and honor later owner changes or removal of the new contact link.
  Keep the version marker internal to the editor.
- [x] Run the existing unit, build, and browser/compliance checks. Check all six
  guide endings and their contact navigation on desktop/mobile in both themes,
  then provide the local preview for owner review.

This selection changes navigation links only. Article bodies, source notes,
substantive review dates, layout, styling, forms, and analytics behavior remain
unchanged. All 216 unit tests and 122 browser/compliance checks passed, including
the production build and prerendering. The compatibility test covers the six
selected guides, existing custom contact destinations, custom reading labels
and ordering, input immutability, repeat normalization, and later removals.

Additional checks exercised each of the six guide endings at 1440 pixels in
both themes, 390 pixels in light mode, and 320 pixels in dark mode. Each retained
its two reading links plus one contact link. Keyboard activation on desktop
and ordinary activation on mobile opened Contact correctly. No app/console
errors, clipped buttons, or horizontal overflow appeared. Targeted mobile
accessibility checks found no violations, and desktop checks made no Google
Analytics requests with consent declined. Screenshots retained the current
design; the public stylesheet hash is unchanged. The existing buyer and seller
guides still have their original two related links. The Browser plugin is
unavailable, so validation used the repository's installed Playwright Chromium.

The production-style preview at `http://localhost:4175` was rebuilt with the
existing public browser configuration. All six guides show exactly one new
contact link, and its Contact destination opens successfully. Real published
content requests returned 200; these guide routes currently use their compiled
fallbacks. No inquiry/subscription was submitted and no production content was
written. Implementation and local verification are complete. The owner
approved the preview and authorized committing and pushing the work on
October 17. The original roadmap remains complete.

## Owner-selected October 17 Mobile Guide Contents

The owner selected a compact sticky On this page dropdown for the eight
Insights articles on mobile, preserving the existing look.

- [x] Replace the mobile contents list with a closed native disclosure that
  sticks below the measured site header when reached. Retain the full desktop
  sidebar and the existing section names, order, and native fragment links.
- [x] Close on selection, Escape, outside pointer, focus leaving the menu, and
  breakpoint/guide changes. Keep keyboard focus and fragment history usable;
  align section destinations below both bars, bound the popup to actual
  remaining viewport space, and let the bar leave with the reading area.
- [x] Complete unit, build, browser/compliance, accessibility, responsive, and
  visual verification, then provide the local preview for owner review.

All 216 unit tests and 126 browser/compliance checks passed, including the final
production build and prerendering. Four new browser cases cover the eight
desktop lists, mobile normal-flow and sticky popup bounds, section clearance,
fragment/query preservation, repeated navigation and Back/Forward, keyboard
focus, Escape/outside/focus-leave dismissal, breakpoint resets, header wrapping,
and release at the reading-area boundary. The final source measures available
space before opening to avoid a temporarily collapsed popup after scrolling.

Additional screenshot and accessibility checks at 1440 pixels in both themes,
390 pixels in light mode, and 320 pixels in dark mode retained the editorial
design and found no app/console errors, horizontal overflow, or targeted
accessibility violations. A 640-by-360 landscape check confirmed the menu stays
scrollable within the remaining space before pinning. The Browser plugin is
unavailable, so validation used the repository's installed Playwright Chromium.

Implementation and local verification are complete. The owner approved the
production-style preview at
`http://localhost:4175/insights/coastal-property-due-diligence` and authorized
committing and pushing on October 17. Article wording, source notes, review
dates, contact links, forms, and analytics are unchanged. No inquiry/subscription
was submitted and no production content was written. The original roadmap
remains complete.

## Owner-selected October 17 Remaining County Guide Links

The owner selected relevant guide links for the five remaining county
introductions, preserving the discreet treatment already used on Camden and
Atlantic.

- [x] Add coastal due diligence to Cape May; property research and municipal
  records to Burlington and Gloucester; and property research plus questions
  about homes with wells, septic, or acreage to Cumberland and Salem. Keep
  property-specific wording and the two existing county link sets.
- [x] Reuse the existing one-time content upgrade and version 1 so newly mapped
  counties receive their links while saved Camden/Atlantic edits and removals
  remain intact. Preserve custom labels, ordering, and removed introductions.
- [x] Verify initial HTML, saved content, destinations, mobile appearance,
  consent behavior, and the existing callouts. Run the unit/build/browser
  checks and provide the local preview for owner review.

This selection adds nine links using the existing underlined treatment. Narrow
screen checks exposed an existing long-heading overflow: the stacked county
introduction now has a shrinkable grid column and a continuous heading size
that fits the page margins. The typeface, weight, colors, and desktop design
are preserved. County and guide wording, source notes, review dates, town
profiles, images, forms, and analytics behavior are unchanged.

Completed locally on October 17: all 216 unit tests and 136 browser checks
passed, including initial HTML links, destinations, consent behavior, and
saved owner edits. The final public-config build prerendered all 30 public
routes. Manual checks used published content on all five pages at desktop
width in light mode and mobile width in dark mode, opened all nine links,
and verified the longest headings at narrow and intermediate widths. No
application errors were observed. The owner reviewed the local preview and
approved committing and publishing this selection on October 17. The original
roadmap remains complete.

## Owner-selected October 17 Native Link Navigation

The owner selected consistent browser new-tab behavior across the public site,
with the existing appearance preserved.

- [x] Use a shared click rule for all public links that perform client-side
  navigation. Leave Command/Ctrl/Shift/Alt clicks, non-primary buttons,
  explicit other targets, downloads, and already-cancelled events to the
  browser. Keep protocol-relative external destinations native.
- [x] Preserve ordinary click and keyboard navigation, menu cleanup, town
  expansion, section focus, and existing consent-gated analytics. Leave
  native external, source, phone, and email links intact. Allow content links
  rendered without a navigation callback to follow their normal destination.
- [x] Verify new tabs retain the original page and reading state, check normal
  navigation and both themes at desktop/mobile widths, and complete the unit,
  build, and browser/compliance checks.

No layout, styling, copy, form-submission, or storage behavior is changed.
Completed locally on October 17: all 239 unit tests across 28 files and 140
browser/compliance checks passed. These include native modified and middle
clicks, unchanged original scroll/expanded-town/menu state, ordinary click and
Enter navigation, existing analytics behavior, and town/article hash links.
The final public-config build prerendered 30 public routes. Manual checks
with published content at 1440 × 1000 in light mode and 390 × 844 in dark mode
confirmed actual Command-click popups and ordinary/keyboard navigation, with
no application errors or framework overlays. The desktop screenshot matched
the prior build exactly; mobile appearance was also reviewed. Stylesheet and
layout markup are unchanged. Browser validation used bundled Playwright
Chromium because the Browser plugin is not available. No form was submitted.
The owner confirmed that a guide opened in a new tab and approved committing
and publishing this selection on October 17. The original roadmap remains
complete.

## Owner-selected October 17 Insights Label

- [x] Simplify the Insights eyebrow to “Real estate guidance,” preserving the
  existing layout and styling. The public-config preview build and all 140
  browser/compliance checks passed. Desktop and mobile preview checks confirmed
  the new label with no application errors or horizontal overflow.

The owner reviewed the local preview and approved committing and publishing
this wording update on October 17.

## Owner-selected October 18 Contact Question Topic

- [x] Add “Property or real estate question” to the existing Contact topic
  dropdown, preserving its styling and all required fields, disclosures,
  and submission behavior. Record successful consented inquiries under the
  fixed `property_question` analytics category.
- [x] Verify the new topic's complete form payload and analytics classification
  while retaining buying coverage. All 240 unit tests, 140 browser/compliance
  checks, and four frozen Edge Function entrypoint checks passed. The latter
  used the existing cached Deno 2.9.6 runtime. The public-config preview build
  passed; desktop and mobile checks found no application errors or overflow.
- [x] Complete a labeled preview submission, confirm notification delivery,
  and remove its exact inquiry and rate-limit records.

Completed locally on October 18. The owner submitted the labeled test through
an isolated local QA preview that accommodates the app's forwarded localhost
address. The real form service verified Turnstile, retained the selected topic,
and sent the notification in one attempt; the routed mailbox receipt was
independently confirmed. Exact-request cleanup left zero inquiry and rate-limit
rows. The QA proxy configuration and build remained outside the repository;
production origin rules and backend configuration were preserved. No backend
deployment or database migration is needed. The owner reviewed the preview
and successful delivery test and approved committing and publishing this
update on October 18.

## Owner-selected October 18 Complete Insights HTML

- [x] Include the complete eight-guide directory and all article text in the
  initial route HTML, using the existing public components and stylesheet.
  Include headings, paragraphs, working checklists, sources, dates, related
  links, and readable section anchors.
- [x] Use accepted normalized published content, preserving owner edits,
  ordering, and intentional removals. Keep this renderer in the build path
  and retain the existing browser startup and navigation behavior.
- [x] Complete unit, build, browser/compliance, no-JavaScript navigation,
  and desktop/mobile appearance checks.

Completed locally on October 18: all 256 unit tests across 29 files and all 144
browser/compliance checks passed. The public-config build prerendered 30 public
routes. All nine Insights routes were checked against their complete structured
content, including native guide links, article anchors, and related next steps
with JavaScript disabled. Additional mobile native-dropdown navigation passed.
Desktop/light and mobile/dark preview checks confirmed the existing guide
appearance, with no application errors, duplicate headings, or overflow. The
browser JavaScript and stylesheet are unchanged; this renderer runs only during
the build. Browser validation used the repository's Playwright runtime because
the Browser plugin is not available.

The owner reviewed the preview and approved committing and publishing this
update on October 18. The original roadmap remains complete.

## Owner-selected October 18 Town Finder Search History

The owner selected restoring the Counties town-finder search and results when
using browser Back, preserving the current appearance.

- [x] Save the query in its existing browser history entry and restore it when
  returning, without adding history steps while typing. Keep separate visits
  independent and retain Clear, keyboard controls, and native new-tab behavior.
  Derive results from current accepted county content rather than saving cards.
- [x] Verify real Back/Forward navigation, clearing, separate history entries,
  history failures, local-only search text, and unchanged desktop/mobile styling.
  Complete unit, build, and browser/compliance checks and provide the preview.

Search text stays in browser history state; it is not added to the address,
analytics, form requests, or server storage. This selection leaves the original
roadmap complete.

Completed locally on October 18: all 261 unit tests across 30 files passed.
The full browser/compliance run passed all 144 existing checks; after correcting
the expected Burlington Washington Township title in the two new history
scenarios, the focused town-finder run passed all seven cases. Together these
cover all 146 browser/compliance checks. The final public-config build
prerendered 30 public routes and uses current published county content.

Additional preview checks at 1440 × 1000 in light mode and 390 × 844 in dark
mode confirmed restored Washington Township and Merchantville queries, working
town destinations, and persistent clearing. The finder screenshots match the
previous build pixel for pixel. No page errors, console warnings/errors,
framework overlays, horizontal overflow, search transmissions, or denied-consent
analytics events occurred. Browser validation used the repository's Playwright
Chromium because the Browser plugin is not available. No inquiry or subscription
was submitted. The owner tested the preview, confirmed the restored search works,
and approved committing and publishing this update on October 18.

## Owner-selected October 19 Printable Insights Guides

The owner selected clean browser printing and Save as PDF for all eight guides,
with the onscreen appearance preserved.

- [x] Add article-scoped print styles with a single readable column, white
  paper, compact typography, checkboxes, visible source addresses, review and
  access dates, and the existing article notice and footer disclosures.
  Keep headings with their text and avoid splitting individual checklist items.
  Suppress navigation and interactive controls only when printing.
- [x] Verify all eight guides on US Letter and A4, from both light and dark
  modes, using real PDF exports and rendered page inspection. Check complete
  text, links, pagination, disclosures, and unchanged desktop/mobile screens.
  Complete the unit, build, and browser/compliance checks and provide a preview.

This uses the browser's existing Print command. No separate PDF content model,
download service, onscreen control, or new processor is introduced. The original
roadmap remains complete.

The owner requested a clear website attribution after reviewing the sample.
Each printed guide now starts with `southjerseyreal.estate`, linked to the
canonical homepage in saved PDFs, so a reader can return to the site later.
This attribution is hidden on normal screens. The revised 32-PDF review
confirmed the address appears once on each first page with a working canonical
homepage link; all 16 screen comparisons still matched the original.

Local checks on October 19 passed all 261 unit tests and 148 browser/compliance
checks. The two new all-guide print cases were repeated after the final
pagination refinements and passed: readable Letter/light and A4/dark copies,
complete content and source addresses, source typography, paper bounds, footer
disclosures, real PDF output, and restoration of the original screen layouts.
The public-config preview build prerendered all 30 public routes using current
published content. All 16 before/after desktop/light and mobile/dark screenshots
across the eight guides matched pixel for pixel. Initial article printing with
JavaScript disabled also passed on all eight routes. No page errors, overflow,
or denied-consent analytics events were observed; no form was submitted.

Final PDF review covered 32 exports and 96 pages: all eight guides on both paper
sizes in each theme. Every paragraph, checklist item, source title and visible
URL, review/access date, and disclosure was retained, with working PDF source
links. The light and dark exports matched pixel for pixel. Rendered page
inspection found no clipping, blank pages, orphaned section headings, split
checklist items, or pages containing only the disclosure footer. The last
citation stays with the compact text-only brokerage and fair-housing footer.
Normal screens keep the existing credential graphics. Print validation used
local Chrome exports and the repository's Playwright Chromium because the
Browser plugin is not available. A sample PDF and the local preview are ready
for owner review; no production content was written during verification.
The owner reviewed the updated sample with website attribution and approved
committing and publishing this update on October 19.

## Owner-selected October 19 Guide Print Action

The owner selected a discreet `Print / save PDF` action on all eight guides,
using the existing article details and visual style.

- [x] Add a native text-style button beside the article metadata that opens
  the browser's Print dialog. Supply the action from the interactive app so
  the no-JavaScript article HTML does not contain an inert button.
- [x] Reuse the existing link color, typography, underline, and keyboard focus
  treatment. Keep the action usable at narrow widths and hide it when printing,
  preserving the guide's website attribution and complete print layout.
- [x] Complete the unit, build, and browser/compliance checks and provide a
  local preview for owner review.

Completed locally on October 19: all 261 unit tests and 148 browser/compliance
checks passed, including complete Letter/light and A4/dark guide exports and
screen restoration. Targeted interaction review passed all eight guides at
1440, 390, and 320 pixels: clicking, keyboard Enter/Space, visible focus,
unchanged route/content, print hiding, screen restoration, and no overflow.
The review observed no page errors or denied-consent analytics requests and
submitted no form. The action's browser call was verified with a local print
spy; the existing PDF checks separately verified the print output. The owner
reviewed the corrected preview and approved committing and publishing this
addition on October 19. The original roadmap remains complete.

The owner noticed a vertical text offset in the preview. The metadata row now
aligns all of its text on a shared baseline above the mobile breakpoint,
correcting the action's four-pixel offset without reducing its click target.
Measured text positions match at 1440 and 1000 pixels; the 390- and 320-pixel
mobile layout measurements are unchanged. The 24 targeted guide interaction
checks and all 148 browser/compliance checks passed again after this correction.
The production build also rendered all metadata labels on the same baseline.

## Owner-selected October 19 Town Finder Abbreviations

The owner selected common town abbreviations in the existing finder, keeping
its current appearance.

- [x] Normalize whole `Mt`/`Mt.` and `Twp`/`Twp.` tokens to `Mount` and
  `Township` during matching, for both queries and accepted town headings.
  Retain the current case, accent, punctuation, and spacing handling.
- [x] Preserve displayed names, county labels, destinations, exact/prefix
  ranking, accepted-content indexing, and original typed history queries.
  Keep the existing input, results, styling, and local-only search behavior.
- [x] Verify abbreviation matches, county disambiguation, owner edits/removals,
  ranking, whole-word boundaries, result navigation, and Back restoration.

Completed locally on October 19: all 270 unit tests and 150 browser/compliance
checks passed. The new browser cases cover desktop/light and mobile/dark
abbreviated searches, existing profile destinations, and restoration of the
original typed query. Additional review of the public-config preview at 1440,
390, and 320 pixels confirmed the existing layout, working current-content
results, county disambiguation, and no overflow, page errors, or denied-consent
analytics requests. No form was submitted. The owner confirmed the preview
works and approved committing and publishing this addition on October 19.
The original roadmap remains complete.

## Owner-selected October 19 Form Disclosure Tabs

The owner selected opening Privacy Policy and Terms of Service from the
Contact and Newsletter forms in a new tab, preserving the current appearance.

- [x] Set native new-tab destinations on only those four links, retain the
  existing click tracking, and announce the new tab to screen readers without
  changing visible link text or styling.
- [x] Verify ordinary clicks and keyboard activation reach the legal pages
  without replacing the original form document or losing entered values.
  Preserve both checked and unchecked newsletter consent states.
- [x] Check desktop/light and mobile/dark rendering, isolated new tabs without
  an opener, and continued same-tab behavior for other disclosure links.

Completed locally on October 19: all 270 unit tests, the production build, and
152 browser/compliance checks passed. The 150 existing browser checks passed
in the full run; both new cases passed on a targeted rerun after correcting
test setup for Turnstile's dynamically inserted hidden field and opaque popup
documents. Additional public-config preview checks at 1440 and 390 pixels
found no page errors or horizontal overflow. The visible consent copy and
form styling are unchanged. No real inquiry or subscription was sent for this
navigation-only pass; the browser tests confirmed that following these links
sent no form requests. The owner approved the preview and authorized committing
and publishing this navigation change on October 19. The original roadmap
remains complete.

## Owner-selected September 4 Maintenance

- [x] Implement the seven confirmed audit corrections in source:
  1. Preserve shareable town anchors when Analytics is enabled.
  2. Make all eight Insights articles accessible in the private editor.
  3. Expose and validate navigation destinations while protecting page identity.
  4. Preserve edited Insights order, removals, and additions; upgrade older
     unversioned libraries once without repeatedly restoring removed cards.
  5. Give changed contact retries a new request ID while keeping unchanged
     retries idempotent.
  6. Stop aged or exhausted notification retries before calling Brevo and move
     them to `manual_review`.
  7. Deliver responsive derivatives of the approved homepage photographs,
     preload the selected desktop theme's hero, and use small lazy footer marks.
- [x] Address related source issues: preserve reading position during content
  refresh, retain town expansion through theme changes, support internal query
  strings and fragments, keep homepage paragraphs inside their desktop column,
  bound public-content loading to ten seconds, fail
  production prerendering when published content cannot be trusted, and add
  Deno entrypoint checks to CI, including pull requests targeting `main`.
- [x] Complete a clearly labeled preview contact/notification delivery check
  with real Turnstile verification, inbox confirmation, and test-record cleanup.
- [x] Release the candidate after owner authorization. Confirm the deployed
  frontend and Edge Function revisions together.

The implementation follows failing regression tests before fixes. Final local
verification passed: `npm test` (150 tests), `npm run test:compliance` (build
and 80 browser checks), all four `npm run test:edge` entrypoints, and
`git diff --check`. The actual prerender command also correctly rejected
offline mode under simulated Pages production flags. Desktop and mobile
screenshots were reviewed, including both themes for the homepage copy fix.
Database integration tests were not run because the Docker-backed local stack
was unavailable. The real delivery check used the candidate frontend on the
already allowed `localhost:5173` origin and an exact temporary hosted copy of
`contact-submit`. A test-only browser adapter changed only the contact endpoint.
The owner completed Turnstile in normal Chrome; the handler returned 201,
notification status was `sent` on attempt one, and the matching email was
confirmed in the inbox. Cleanup verified zero inquiry/rate-event rows and
removed the temporary function. Production functions remained unchanged during
that preview check.
Pages branch preview origins are not currently allowed by the public form
handler; no origin rules or Turnstile secrets were changed for this test.
An early notification-test mock allowed
requests with dummy credentials that Brevo rejected; the corrected regression
tests block all external requests; those dummy-key requests produced no
accepted email sends.

The authorized production release completed September 5. Audit commit
`3773f6a` and the production-policy alignment `4150a58` are on `origin/main`.
The latter preserves the deployed contact handler's default origin and
Turnstile hostname lists without changing configured allowlists. Its
[GitHub test run](https://github.com/piskooooo/southjerseyreal.estate/actions/runs/33943452950)
passed 157 unit tests, 80 rendered compliance checks, and all four Edge Function
entrypoint checks. Cloudflare Pages successfully deployed both revisions.
Independent checks on the canonical production site passed eight browser cases
and six public-route HTTP checks, including desktop/mobile homepage imagery,
both desktop themes, shared town links, form-page metadata, and real 404s.
The production bundle retains the approved GA4 measurement ID.

The named `contact-submit` deployment is active; its four downloaded source
files exactly match `4150a58`, and harmless origin preflights retain their
pre-release behavior. The previous deployed source was saved for rollback.
No database migrations, secret changes, or NAS actions were required. The
original August 7 roadmap remains closed.

## Completed Selected Maintenance

- [x] August 27, 2026 — Implemented and locally verified a focused SEO
  relevance and click-through pass for the homepage plus the Atlantic,
  Burlington, Camden, Cape May, and Cumberland County pages. The candidate
  introduces Arthur as a South Jersey REALTOR®, adds concise buyer/seller
  guidance and honest contact paths, improves the homepage title and the six
  priority descriptions, adds homepage professional-identity schema, merges
  the homepage's regional introduction into its lead composition, pairs the
  existing city image with the buyer/seller actions, exposes contextual links
  in prerendered HTML, and upgrades only exact legacy published values while
  preserving owner-customized metadata. Verification passed 103 unit tests,
  the production build, and 70 rendered compliance checks across all 30 public
  routes. This completion record covers source-level work and verification; no
  Search Console action was taken.
- [x] August 10, 2026 — Expanded the editable Insights library from three to
  eight evergreen New Jersey and South Jersey real-estate guides. The library
  retains original publication dates for the earlier guides, records their
  substantive review date, adds visible authorship, primary-source notes,
  internal guide/county links, sitemap and article metadata coverage, and a
  compatibility safeguard for older published index content. This is completed
  content maintenance, not a reopened high-frequency blog or roadmap item.
- [x] August 10, 2026 — Rewrote all 166 community-card summaries into
  visitor-facing descriptions using the published local recreation, shopping,
  dining, transportation, and service facts. Removed editorial/source-note
  language from the public summaries while retaining the detailed snapshots and
  dated source links.

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
- [x] Run the audit scans plus production build, 92 unit tests, 49 tracked database checks, and 37 rendered-route/browser acceptance checks across the 21 public routes that existed at the time. These are preserved historical audit totals; the completed site now has 30 public routes and broader automated coverage.
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
- [x] Cover sitewide navigation, footer, and privacy content plus all 30 public routes, including both hub pages, the seven county guides, Insights, resource/comparison pages, FAQ, and legal pages, as structured editable documents with compiled fallbacks.
- [x] Add recursive field editing, unsaved/saved/published status, draft save, atomic publish, discard-to-published, optimistic-concurrency checks, safe-link validation, and required image alt-text validation.
- [x] Add JPG, PNG, WebP, and AVIF uploads with file and decoded-dimension limits, optimized page/admin variants, replacement/removal handling, and storage cleanup warnings.
- [x] Add the private, paginated contact-inquiry inbox without exposing the `private` schema or a service-role key to the browser.
- [x] Add the local Supabase migration for the one-slot UUID administrator table, public published-only content, private drafts, RLS/grants, audited publish/revert/inquiry RPCs, and the admin-write-only `site-images` storage policies.
- [x] Add the authenticated `site-rebuild` Edge Function with origin validation, JWT/user verification, UUID administrator verification, strict deploy-hook URL validation, and fail-closed error handling.
- [x] Connect the public layouts to published Supabase content with compiled fallbacks, and add route-specific HTML/metadata plus sitemap prerendering for crawler-visible SEO changes.
- [x] Add editor content/inbox/image tests and transactional pgTAP coverage. Verification at task completion passed 92 Vitest tests, 49 database checks, the production build, Deno formatting/type checks, and public/fail-closed browser checks; later roadmap work expanded the suite.
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
- [x] Inspect all 21 public routes that existed during the dark-theme review at `1440×1000`, `768×1024`, and `390×844`, plus the intentionally light-only `/admin` boundary at all three responsive classes. Later routes were covered by their own responsive and accessibility checks.
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
activation-ready work, paused plans, and deferred concepts.

### Project Audit and Deliverables

- [x] Review the production site, private editor, integrations, tests, project documentation, unpublished previews, and preserved roadmap work.
- [x] Separate public visitor features, private content-management features, integrations, accessibility/SEO work, privacy/security controls, operational/recovery features, and future work into clear categories.
- [x] Write one-line, short, portfolio, and extended project descriptions suitable for future marketing use.
- [x] Produce a comprehensive feature inventory using explicit `Live`, `Live - Private`, `Beta / Editorial Preview`, `Built - Activation Pending`, `Planned / Paused`, `Deferred Concept`, and `Marketing Campaign` labels.
- [x] Include the richer community profiles, Google review activation, dark theme, community-photography and local-business outreach campaigns, deferred Bright IDX research, and the live website-supported weekly newsletter editorial workflow.
- [x] Add a marketing-claim guide that identifies accurate current language and claims that must wait for a status change.
- [x] Keep private credentials, infrastructure identifiers, personal data, and secret values out of the marketing copy.
- [x] Save the finished material in [marketing-project-description.md](./marketing-project-description.md).

Completion date: July 20, 2026

Maintenance note: this is a living marketing record. Update status labels and
ready-to-use descriptions whenever a preview, activation-ready feature, or
planned item changes production status.

The community-photography and provider/local-advertising ideas are marketing
campaigns that use the completed website. They are not unfinished engineering
tasks and should not be included when reporting the active website to-do list.

**Done when:** The saved document covers the whole project, includes reusable
short and long descriptions plus a categorized feature inventory, contains no
confidential information or unsupported live claims, and preserves accurate
status labels for live, completed, campaign, and deferred work.

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

## 14. Add an Evergreen Insights Section

**Goal:** Publish durable, genuinely useful South Jersey real-estate guidance
without creating a high-frequency news or blogging obligation.

- [x] Add an `Insights` index and structured article routes using the site's existing content/layout separation.
- [x] Make article titles, summaries, sections, sources, review dates, metadata, and social-sharing fields editable through the private website editor.
- [x] Create an initial small set of evergreen buyer, seller, and South Jersey market-process guides using supportable sources and carefully qualified language.
- [x] Add article schema, canonical metadata, sitemap entries, internal links, and clear reviewed/updated dates without presenting old material as current advice.
- [x] Verify responsive layout, keyboard behavior, accessibility, metadata, editor publishing, and production rendering before launch.

Completion date: July 25, 2026

**Done when:** A visitor can browse and read the published sourced Insights library,
the owner can maintain it through `/admin`, and automated compliance checks cover
the new public routes and metadata.

## 15. Finish the Google Business Profile Handoff

**Goal:** Put long-term control of the verified Google Business Profile under the
owner's intended Google account and confirm the public details are accurate.

- [x] Confirm `arthurpisko@gmail.com` has Owner access. Verified July 25, 2026.
- [x] Transfer Primary owner status from the separate `Real Estate` account to `arthurpisko@gmail.com`. Completed August 7, 2026, after Google's waiting period ended; the separate account remains an Owner.
- [x] Confirm the accepted website is `https://southjerseyreal.estate/` and the obsolete X profile is no longer displayed. Verified July 25, 2026.
- [x] Owner reviewed and confirmed the displayed hours, business name, phone, description, and REALTOR® wording on July 27, 2026.
- [x] Confirm Google finishes reviewing and publicly propagating the July 27 location and service-area edits. Verified August 7, 2026: the public profile does not display a street address, the profile is configured for service-area operation, and the service area contains only Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties. Ocean County is not included. The site's licensed-office disclosure remains unchanged.
- [x] Recheck the live profile after the ownership transfer and any approved detail changes. Verified August 7, 2026: the business name, website, phone, hours, description, REALTOR® wording, Instagram profile, and Facebook profile remain correct, with no obsolete X profile or unresolved identity/location mismatch.

Completion date: August 7, 2026

**Done when:** The intended account is the Primary owner, the owner has approved
the displayed public details, and a final live check finds no obsolete links or
unresolved identity/location mismatch.

## 16. Confirm Current Provider Relationships

**Goal:** Close the one current human follow-up in the provider-directory review
without expanding the directory or inventing a new referral program.

- [x] Ask the responsible broker to confirm that no referral, affiliate, family, ownership, or transaction-based arrangement is omitted from any current directory entry. The owner reports verbal confirmation on July 25, 2026.
- [x] Record only the confirmation and date in [compliance-review-checklist.md](./compliance-review-checklist.md); do not store privileged advice or private relationship details in the repository.
- [x] Determine whether the answer requires a public disclosure change. The reported confirmation identified no omitted arrangement, so no copy change was required.

The separate counsel-review item remains conditional on a future settlement-service
advertisement or affiliated-business arrangement and is not part of the active
roadmap unless such a feature is proposed.

**Done when:** The broker confirmation is recorded, any required public disclosure
change is published and verified, and the matching checklist item is checked.

Completion date: July 25, 2026

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
- [x] Add 100 Vitest tests, 66 rendered browser compliance checks, and a 43-check transactional Supabase pgTAP suite, and keep the GitHub test workflow on every push.
- [x] Build and publish the private website-editor frontend, database migration, image/inbox support, managed public-content adapter, and SEO rebuild implementation while keeping production access fail-closed until provisioning is complete.
- [x] Document private inquiry access, production test cleanup, Pages recovery, retired NAS resources, and the final human compliance handoff.
