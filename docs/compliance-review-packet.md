# South Jersey Real Estate Compliance Review Packet

Prepared: July 19, 2026

Review target: <https://southjerseyreal.estate/>

This packet summarizes the implemented website presentation for a responsible
human reviewer. It is not legal advice and is not a compliance certification.
The detailed technical record remains in
[`compliance-review-checklist.md`](./compliance-review-checklist.md).

## What the Reviewer Is Approving

Please review the rendered production site, then approve or return edits for:

- The exact brokerage name, descriptor, licensed-office facts, disclosure
  hierarchy, and sitewide footer placement.
- The Equal Housing Opportunity treatment and broker-specific fair-housing
  statement.
- The Privacy Policy, Terms of Service, Disclaimer, contact authorization, and
  newsletter consent.
- The current provider-directory relationships and relationship disclosures.
- The production tracker and processor inventory.

## Implemented Brokerage Facts

These values are centralized in `src/content/complianceData.json` and are used
by the visible disclosure, metadata, and structured data.

| Fact | Implemented value |
| --- | --- |
| Brokerage | `THE PLUM REAL ESTATE GROUP LLC` |
| Descriptor | `New Jersey Real Estate Broker` |
| Licensed office | `901 Cooper St, Suite 2, Deptford, NJ 08096` |
| Licensed office phone | `(856) 537-5464` |
| Salesperson | `Arthur Pisko Jr.` |
| License | `New Jersey Real Estate Salesperson`, `2187170` |
| Brokerage affiliation | Active, as rechecked in NJDOBI records on July 18, 2026 |
| REALTOR membership | Owner-confirmed and publicly corroborated on July 18, 2026 |

Primary fact sources:

- [NJDOBI Licensee Search](https://www-dobi.nj.gov/DOBI_LicSearch/recSearch.jsp)
- [The Plum Real Estate Group](https://www.theplumrealestategroup.com/)

## Disclosure Evidence

The licensed-brokerage disclosure is the first element inside the footer on all
21 public routes. On desktop and mobile it includes the broker name, broker
descriptor, licensed-office phone, salesperson name, license type, and license
number.

Measured production evidence:

| Check | Desktop | Mobile |
| --- | ---: | ---: |
| Viewport | `1440 x 1000` | `390 x 844` |
| Broker-name size | `14.72px` | `14.72px` |
| Broker-name weight | `850` | `850` |
| Salesperson-line size | `11.52px` | `11.52px` |
| Horizontal overflow | `0px` | `0px` |
| Primary text / dark canvas | `16.33:1` | `16.33:1` |
| Muted text / dark canvas | approximately `10.29:1` | approximately `10.29:1` |

Rendered evidence:

- [Desktop disclosure](./qa-screenshots/brokerage-disclosure-desktop.png)
- [Mobile disclosure](./qa-screenshots/brokerage-disclosure-mobile.png)

Automated coverage verifies the disclosure in both hydrated and prerendered
output for every public route, checks broker prominence at 320 pixels, scans for
horizontal overflow, and runs WCAG 2.0 through 2.2 AA checks on representative
routes. Final run totals are recorded in the detailed checklist after release.

## Production Verification

The July 19 production pass confirmed the current Cloudflare Pages deployment,
successful contact and newsletter submission paths, exact synthetic-data
cleanup in Supabase and Brevo, and accepted GA4 debug-mode collection requests.
Google accepted one page view per tested route, the prior virtual URL as the SPA
referrer, contact `generate_lead` plus `contact_lead`, and newsletter `sign_up`
without a contact lead event. The DebugView visual panel nevertheless displayed
zero debug devices, so that Google-interface check remains open and is not
represented as a completed visual-timeline test.

## Provider Relationship Record

HomeBase CRM is presented only as a technology vendor in the provider
directory. The owner has confirmed all of the following:

- HomeBase CRM is owned by Fat Cat Finance, LLC.
- Fat Cat Finance, LLC is the company credited with creating and maintaining
  this website.
- The HomeBase CRM directory entry is unpaid.
- HomeBase CRM shares no ownership with this website or the affiliated
  brokerage.

Human confirmation is still needed that no referral, affiliate, family, or
transaction-based arrangement has been omitted from either current directory
entry.

## Current Scope

The site does not currently publish property listings, paid provider cards,
reviews, testimonials, awards, a multi-agent roster, or automated marketing
calls/texts. Those features require a new review before publication. Future
Bright MLS/IDX work remains deferred in `bright-idx-backlog.md`.

All seven richer county/community batches have been researched as unpublished
editorial drafts. They are outside the current rendered-site approval until the
owner reviews their text and municipality images and publishes them in the
structured editor.

## Signoff

| Decision | Reviewer | Date | Status or requested change |
| --- | --- | --- | --- |
| Brokerage facts and disclosure presentation |  |  |  |
| Fair-housing wording and marks |  |  |  |
| Privacy, terms, disclaimer, and form consent |  |  |  |
| Provider relationships and agreements |  |  |  |
| Tracker and processor inventory |  |  |  |
| Final rendered-site review |  |  |  |

Final status: `Approved` / `Approved with changes` / `Not approved`
