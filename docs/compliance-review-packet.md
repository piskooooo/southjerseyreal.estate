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
without a contact lead event. A final pass added direct event-level debug signals
and Google's documented GA4/Tag Assistant CSP endpoints. The controlled browser
still did not attach to Tag Assistant or appear in DebugView, which is recorded
as a client/browser diagnostic limitation rather than a production tracking
blocker.

## Provider Relationship Record

The provider directory is limited to unpaid real-estate-related listings. The
owner confirmed on July 19, 2026 that neither the site operator nor the
affiliated brokerage is to receive compensation for inclusion, ranking, or a
consumer's selection of a listed provider. Mortgage and title-company facts
were rechecked against current official provider profiles before restoration.
The separate advertising program is reserved for businesses outside the real
estate transaction, and no paid advertisement is currently live.

Human confirmation is still needed that no referral, affiliate, family,
ownership, or other material relationship has been omitted from a current
directory entry.

## Current Scope

The site does not currently publish property listings, paid settlement-provider
cards, live local-business advertisements, awards, a multi-agent roster, or
automated marketing calls/texts. Future Bright MLS/IDX work remains deferred in
`bright-idx-backlog.md` and requires its own data-display review.

Client feedback is limited to the About page. A genuine public review does not
require a separate written-consent record merely because it is displayed here.
The Google section uses Google-provided review and author attribution data,
preserves Google's relevance order, and links every card to its source. It
clearly states that this website displays only returned 4- and 5-star reviews
and links to the complete Google review profile, so the selected cards are not
presented as the complete or representative review history. Facebook, Zillow,
and Realtor.com are direct source links unless a current platform-supported
display method is later implemented. The site must not gate review requests,
condition incentives on positive sentiment, alter source reviews, or suppress
reviews on the source platforms. Private messages, customer photos or video,
and other separately protected content are not treated as public reviews.

All seven richer county/community batches have been researched as unpublished
editorial drafts. They are outside the current rendered-site approval until the
owner reviews their text and municipality images and publishes them in the
structured editor.

## Owner Disposition

The site owner accepted the current rendered production site and closed the
current-site compliance project task on July 19, 2026 after the recorded broad
broker consent, attorney presentation feedback, and technical audit. This is a
project disposition, not a claim of independent legal certification. The blank
rows below remain available only if detailed signatures are recorded later;
they are not open engineering tasks.

| Decision | Reviewer | Date | Status or requested change |
| --- | --- | --- | --- |
| Brokerage facts and disclosure presentation |  |  |  |
| Fair-housing wording and marks |  |  |  |
| Privacy, terms, disclaimer, and form consent |  |  |  |
| Provider relationships and agreements |  |  |  |
| Tracker and processor inventory |  |  |  |
| Final rendered-site review | Site owner | July 19, 2026 | Approved for current production |

Final status: `Approved by owner for the current production site`
