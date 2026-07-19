# Deferred Bright IDX Backlog

Status: Deferred on July 18, 2026

This work is not part of the current `southjerseyreal.estate` roadmap. The site will continue without property search or listing-data display. This checklist is preserved for possible use in a separate future project and should not be treated as active work unless the owner explicitly reactivates it.

Do not scrape Bright or manually republish listing data. Any future implementation requires current broker, Bright, vendor, legal, attribution, and display-rule review.

## Phase A: Requirements and Approval

- [ ] Decide which future website or project would host the property search.
- [ ] Confirm the broker of record approves IDX display on that domain.
- [ ] Confirm whether separate personal-site and brokerage-site displays require separate Bright approvals, feeds, or subscriptions.
- [ ] Obtain the Bright office ID needed for any brokerage-only listing view.
- [ ] Decide the geographic scope and property types.
- [ ] Decide whether the first release needs only active listings or additional IDX-permitted statuses.

## Phase B: Select a Vendor

- [ ] Shortlist Bright-approved IDX vendors compatible with the chosen project.
- [ ] Ask each vendor about embeds, hosted search pages, APIs, maps, saved searches, lead routing, SEO, accessibility, mobile behavior, branding control, and total cost.
- [ ] Confirm whether the vendor can provide both a broad IDX search and an office-ID-filtered brokerage view.
- [ ] Confirm who handles Bright attribution, usage tracking, refresh schedules, listing removal, disclaimers, and compliance updates.
- [ ] Choose the vendor and complete Bright/vendor approval.

Selected project/domain: ____________________

Selected vendor: ____________________

Expected monthly cost: ____________________

Approval date: ____________________

## Phase C: Implement and Launch

- [ ] Give Codex the vendor documentation, approved domain details, and non-secret integration identifiers.
- [ ] Add appropriately labeled property-search navigation without suggesting visitors are directly searching Bright MLS.
- [ ] Build the vendor-supported search results, listing details, empty, loading, error, and mobile states.
- [ ] Add vendor-required Bright attribution, listing-broker identification, contact details, and disclaimers.
- [ ] Route listing inquiries through the approved lead destination.
- [ ] Test search filters, maps, listing pages, inquiry forms, accessibility, mobile layouts, analytics, and expired or removed listing behavior.
- [ ] Launch on a preview hostname and obtain any required vendor or Bright approval before production.
- [ ] Verify the production integration and document renewal and support details.

## Reactivation Gate

Reactivate this backlog only after the owner chooses a target project and confirms that property search belongs in its product scope. At that point, recheck all Bright and vendor requirements rather than relying on this deferred snapshot.

**Done when:** An approved property search is live on the chosen project, compliant, mobile-friendly, and successfully delivers a test listing inquiry.
