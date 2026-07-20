# Human Compliance Review Handoff

Last prepared: July 19, 2026

This is an implementation and review record, not legal advice or a compliance certification. The broker of record and, where appropriate, New Jersey counsel must approve the public wording. Keep privileged advice outside this public repository; record only the reviewer, date, status, and final approved wording.

## Verified Public Facts

Codex checked these values on July 18, 2026. They are centralized in `src/content/complianceData.json`.

| Fact | Implemented value | Verification source |
|---|---|---|
| Brokerage regular business name | `THE PLUM REAL ESTATE GROUP LLC` | NJDOBI licensee search, company reference `2080680` |
| Brokerage descriptor | `New Jersey Real Estate Broker` | Audit-required allowed descriptor; broker approval remains required |
| Licensed office address | `901 Cooper St, Suite 2, Deptford, NJ 08096` | NJDOBI licensee search and brokerage website |
| Licensed office phone | `(856) 537-5464` | Brokerage website |
| Salesperson | `Arthur Pisko Jr.` | NJDOBI licensee search |
| License type and number | `New Jersey Real Estate Salesperson`, `2187170` | NJDOBI licensee search |
| Affiliation status | Active and affiliated with the brokerage above | NJDOBI licensee search |
| REALTOR® membership | Active | Owner attestation plus current Realtor.com and brokerage profiles |

Sources:

- [NJDOBI Licensee Search](https://www-dobi.nj.gov/DOBI_LicSearch/recSearch.jsp)
- [The Plum Real Estate Group website](https://www.theplumrealestategroup.com/)

The owner confirmed active REALTOR® membership on July 18, 2026, and current public profiles corroborate that status. The membership mark and logo are restored as an identification of membership. Private membership and MLS identifiers are retained outside this public repository.

## Technical Work Completed

- [x] Put the broker name, descriptor, licensed-office phone, broker link, salesperson license type, and salesperson license number in one visible sitewide footer disclosure.
- [x] Make the broker identity more prominent than the salesperson identity within the footer disclosure and keep it readable at 320 pixels.
- [x] Centralize broker, office, and salesperson facts in one configuration used by visible copy, links, metadata, and JSON-LD.
- [x] Keep unsupported imported county claims retired, retain one unobtrusive page-level verification note, and prepare dated, sourced community profiles for owner review. Clearly label retained 2025 price, tax, and school details as historical site snapshots rather than current claims.
- [x] Add the Equal Housing Opportunity treatment sitewide and place the complete broker-specific fair-housing statement on the Disclaimer page.
- [x] Restore the REALTOR® membership mark after owner confirmation, while keeping private membership and MLS identifiers out of the repository.
- [x] Consolidate detailed legal explanations on the Disclaimer, Privacy Policy, and Terms pages instead of repeating them throughout ordinary editorial copy.
- [x] Add exact ordinary-inquiry authorization plus adjacent Privacy and Terms links.
- [x] Add required, unchecked newsletter consent plus adjacent Privacy and Terms links; retain backend consent-version and timestamp evidence.
- [x] Confirm that no automated or prerecorded marketing call/text feature exists; no automated-marketing checkbox was added.
- [x] Align the Privacy Policy with Cloudflare Pages/Turnstile, Supabase, Brevo, local preference storage, and consent-gated GA4.
- [x] Make GA4 stay unloaded before opt-in and unload its script/state when consent is withdrawn.
- [x] Restore the unpaid real-estate provider directory with one concise choice, no-compensation, and non-guarantee disclosure.
- [x] Recheck every published lender and title-company entry against a current official provider profile, update changed names and companies, and omit the former Signature Title Agency listing because no current official Millville source was found.
- [x] Add editor phrase/credential checks and runtime rejection of noncompliant published content.
- [x] Fix overlapping desktop dropdowns and cover click, hover, focus, outside-click, and Escape behavior.
- [x] Run the audit's exact high-risk phrase scan and phone/email scan and manually classify all remaining hits.
- [x] Measure the production brokerage disclosure at desktop and mobile widths, confirm its hierarchy, contrast, and zero overflow, and capture the evidence in [compliance-review-packet.md](./compliance-review-packet.md).
- [x] Pass the production build, 92 unit tests, and 37 Playwright checks covering all 21 public routes, prerendered and hydrated DOM, metadata, JSON-LD, forms, analytics consent, providers, hub navigation, keyboard behavior, 320-pixel layout, screenshots, overflow, alt text, and automated WCAG checks.

## July 18-19 Technical Reverification

- [x] Rechecked the NJDOBI licensee-search records for the salesperson, brokerage affiliation, company, broker of record, and licensed office facts. The implemented facts remain consistent with the public records listed above.
- [x] Audited the production Cloudflare Pages project. It remains connected to `piskooooo/southjerseyreal.estate`, deploys `main` automatically with `npm run build`, publishes `dist`, uses Node 22, has the five expected public production build-variable names, omits the production GA4 ID from preview builds, and serves the apex, `www`, and Pages hostnames.
- [x] Audited the production Supabase project without recording secret values or personal data. The project is healthy; `contact-submit`, `newsletter-subscribe`, and `site-rebuild` are deployed; the expected custom secret names are present; and a read-only count confirmed one Auth user and one private site-administrator slot.
- [x] Audited the personal Brevo workspace without recording contact data. Website signups target list `8`, the double-opt-in template `2` is active, and the `southjerseyreal.estate` sending domain and sender are verified.
- [x] Audited GA4 property `Main Website`. Its production stream uses measurement ID `G-97H86MNHP8`; data retention is 14 months; email plus configured sensitive query parameters are redacted; manual SPA and outbound-click tracking are de-duplicated; `form_name`, `lead_type`, and `link_source` are registered; and only the direct `contact_lead` event is marked as an editable lead key event.
- [x] Reverified production GA4 collection on July 19. Google returned `204` for debug-mode home and Counties page views, preserved the previous virtual home URL as the Counties referrer, accepted contact `generate_lead` plus `contact_lead`, and accepted newsletter `sign_up` without contact lead events. A final pass added direct event-level debug signals and Google's documented GA4/Tag Assistant CSP endpoints. The controlled browser still did not attach to Tag Assistant or appear in DebugView, which is recorded as a client/browser diagnostic limitation rather than a production tracking blocker.
- [x] Submitted clearly labeled production contact and newsletter tests, confirmed the contact notification reached `sent` and the newsletter reached `confirmation_requested`, then removed the exact inquiry, rate-limit, newsletter-audit, and Brevo test records.
- [x] Rechecked public credential evidence. [Realtor.com](https://www.realtor.com/realestateagents/659c35c962a5ff070b97f4b8) and the [brokerage roster](https://www.plum-realestate.com/agents.php) display a REALTOR® claim for Arthur, and Arthur confirmed active membership on July 18, 2026. Private membership and MLS identifiers are not recorded here.
- [x] Scheduled the Codex automation `Quarterly South Jersey Compliance Review` to run every three months on the 18th at 9:00 AM local time, beginning October 18, 2026.
- [x] Added source-note support and drafted seven county introductions plus all 168 current municipalities across 166 profile cards from primary government or public-agency sources. The drafts remain unpublished pending owner content/image review; the source audit found no hard link failures.
- [x] Connected those drafts to a local selective-restoration preview with dated source notes, accessible expand controls, distinct matching for similarly named municipalities, and clearly labeled 2025 historical detail snapshots. Production publication remains pending owner review.
- [x] Restored separate unpaid-provider and paid-advertising pages. The provider directory contains five current mortgage profiles and six title/settlement companies; paid advertising remains limited to businesses outside the real-estate transaction and each future placement must be labeled `Paid advertisement` where it appears.
- [x] Re-ran the audit phrase and contact scans, production build, 92 unit tests, 49 tracked database checks, and 37 Playwright checks after implementing the Google analytics hardening, source-note guardrails, compliance evidence packet, and review-only design/community artifacts.

## Provider Directory Verification

Checked July 19, 2026 against the provider's current official website or profile:

| Published entry | Current public evidence |
|---|---|
| Sam Hamilton, Movement Mortgage, NMLS #1094595 | <https://movement.com/lo/sam-hamilton> |
| Jill Granato, AnnieMac, NMLS #363390 | <https://annie-mac.com/lo/jillgranato/> |
| Matt Ziegert, CrossCountry Mortgage, NMLS #1471164 | <https://crosscountrymortgage.com/denville-nj-3480/matthew-ziegert/> |
| Terri Santiago-Parker, CrossCountry Mortgage, NMLS #135602 | <https://crosscountrymortgage.com/woodbury-nj-2506/theresa-parker/> |
| Drew Whipple, Citizens, NMLS #1132486 | <https://lo.citizensbank.com/nj/marlton/drew-whipple> |
| Cape Atlantic Title Agency, LLC | <https://capeatlantictitle.com/> |
| Two Rivers Title Company, LLC | <https://tworiverstitle.com/> |
| SJS Title, LLC | <https://www.sjstitleco.com/> |
| The Title Company of Jersey | <https://www.tcjonline.com/> |
| Surety Title Company, LLC | <https://www.mysurety.com/> |
| Foundation Title, LLC | <https://foundationtitle.com/> |

The owner reconfirmed on July 19, 2026 that this directory is strictly unpaid. The old Signature Title Agency/Millville entry was not restored because its former website and location could not be confirmed from a current official source.

This technical record does not satisfy the broker, owner, credential-holder, or legal approvals below.

## Not Applicable Yet

- **Property listings/search:** Not implemented and not part of the current site roadmap. Any future listing-data project requires a separate compliance review and is tracked outside this checklist in [bright-idx-backlog.md](./bright-idx-backlog.md).
- **Automated marketing calls/texts:** Not implemented. The ordinary inquiry expressly excludes that consent.
- **Paid settlement-provider cards:** Not accepted. Real-estate transaction providers remain in the unpaid directory. Paid placements are reserved for unrelated local businesses and must display `Paid advertisement` next to each placement.
- **Reviews/testimonials:** Client feedback is contained within the About page so it does not displace the site's South Jersey real-estate and community mission. A genuine review that a customer voluntarily published does not carry a blanket separate written-consent requirement merely because it is shown here. The Google display uses Google-provided review text and author attribution, preserves Google's relevance order, displays only returned 4- and 5-star reviews, clearly states that selection, and links to every displayed source review plus the complete Google profile. The site does not claim that the selected cards are the complete or representative review history. Facebook, Zillow, and Realtor.com remain direct profile links unless a current platform-supported display method is implemented. Do not gate review requests, condition incentives on positive sentiment, alter source-platform reviews, or conceal reviews on the source platform. Seek separate permission for private communications, customer photos or video, or another use that independently requires permission.
- **Awards, designations, and multi-agent roster:** These features are not currently rendered. Review their factual support and applicable display requirements before adding them.
- **Age-restricted community claims:** None remain in the compiled community content.

## Owner Decision and Ongoing Reviews

- [x] The owner reports that the broker has given broad consent to make the changes needed for this site. Exact final wording signoff has not been recorded below.
- [x] The owner's attorney reviewed the site's compliance presentation and advised reducing repeated, overly explanatory copy. The site now uses a layered disclosure approach; this feedback is not recorded as approval of every exact sentence.
- [x] The owner accepted the current rendered broker facts, disclosure hierarchy, and placement for project publication on July 19, 2026. This does not claim a new exact-wording broker certification.
- [x] The owner accepted the current Fair Housing statement and Equal Housing Opportunity treatment for project publication on July 19, 2026. This does not claim independent legal certification.
- [x] The owner accepted the current Privacy Policy, Terms of Service, Disclaimer, ordinary-inquiry authorization, and newsletter consent for project publication on July 19, 2026. This does not claim independent legal certification.
- [x] Owner confirms the provider directory is strictly unpaid and separate from the paid advertising program for businesses outside the real-estate transaction.
- [ ] Broker confirms there is no referral, affiliate, family, ownership, or transaction-based arrangement omitted from any current directory entry.
- [ ] Counsel reviews any future settlement-service advertising or affiliated-business arrangement before publication.
- [x] The owner accepted the production tracker/processor inventory summarized from the Cloudflare, Supabase, Brevo, and GA4 dashboards on July 19, 2026.
- [x] Current REALTOR® membership is treated as owner-verified and publicly corroborated; the mark is restored without storing private membership identifiers.
- [x] Schedule a quarterly review of license status, broker/office facts, credentials, processors/trackers, provider relationships, and public claims.

## Optional Detailed Signoff Record

The owner closed the current-site project review on July 19, 2026 after the recorded broad broker consent, attorney presentation feedback, and technical audit. The blank detailed signature lines below are optional records, not open engineering tasks, and this repository does not claim independent legal certification.

Exact brokerage name verified by: ____________________  Date: __________

Licensed office phone verified by: ____________________  Date: __________

Office address verified by: ____________________  Date: __________

Agent license and affiliation verified by: ____________________  Date: __________

Privacy/tracker inventory completed by: ____________________  Date: __________

Provider relationships and agreements reviewed by: ____________________  Date: __________

Broker of record approval: ____________________  Date: __________

Legal review, if obtained: ____________________  Date: __________

Final rendered-site audit: Site owner project acceptance  Date: July 19, 2026

Codex technical reverification: completed  Date: July 19, 2026

Status: Approved by owner for the current production site
