# Human Compliance Review Handoff

Last prepared: July 18, 2026

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
- [x] Replace unsupported imported county claims with concise community directories and one unobtrusive, page-level verification note.
- [x] Add the Equal Housing Opportunity treatment sitewide and place the complete broker-specific fair-housing statement on the Disclaimer page.
- [x] Restore the REALTOR® membership mark after owner confirmation, while keeping private membership and MLS identifiers out of the repository.
- [x] Consolidate detailed legal explanations on the Disclaimer, Privacy Policy, and Terms pages instead of repeating them throughout ordinary editorial copy.
- [x] Add exact ordinary-inquiry authorization plus adjacent Privacy and Terms links.
- [x] Add required, unchecked newsletter consent plus adjacent Privacy and Terms links; retain backend consent-version and timestamp evidence.
- [x] Confirm that no automated or prerecorded marketing call/text feature exists; no automated-marketing checkbox was added.
- [x] Align the Privacy Policy with Cloudflare Pages/Turnstile, Supabase, Brevo, local preference storage, and consent-gated GA4.
- [x] Make GA4 stay unloaded before opt-in and unload its script/state when consent is withdrawn.
- [x] Convert the Partners page to a neutral provider directory with choice, non-guarantee, paid-placement, and material-relationship disclosures.
- [x] Withhold unverified settlement-service provider entries and lock provider-directory publishing until verification is recorded.
- [x] Add editor phrase/credential checks and runtime rejection of noncompliant published content.
- [x] Fix overlapping desktop dropdowns and cover click, hover, focus, outside-click, and Escape behavior.
- [x] Run the audit's exact high-risk phrase scan and phone/email scan and manually classify all remaining hits.
- [x] Pass the production build, 73 unit tests, and 37 Playwright checks covering all 21 public routes, prerendered and hydrated DOM, metadata, JSON-LD, forms, analytics consent, providers, hub navigation, keyboard behavior, 320-pixel layout, screenshots, overflow, alt text, and automated WCAG checks.

## July 18 Technical Reverification

- [x] Rechecked the NJDOBI licensee-search records for the salesperson, brokerage affiliation, company, broker of record, and licensed office facts. The implemented facts remain consistent with the public records listed above.
- [x] Audited the production Cloudflare Pages project. It remains connected to `piskooooo/southjerseyreal.estate`, deploys `main` automatically with `npm run build`, publishes `dist`, uses Node 22, has the five expected public production build-variable names, omits the production GA4 ID from preview builds, and serves the apex, `www`, and Pages hostnames.
- [x] Audited the production Supabase project without recording secret values or personal data. The project is healthy; `contact-submit`, `newsletter-subscribe`, and `site-rebuild` are deployed; the expected custom secret names are present; and a read-only count confirmed one Auth user and one private site-administrator slot.
- [x] Audited the personal Brevo workspace without recording contact data. Website signups target list `8`, the double-opt-in template `2` is active, and the `southjerseyreal.estate` sending domain and sender are verified.
- [x] Audited GA4 property `Main Website`. Its production stream uses measurement ID `G-97H86MNHP8`; data retention is 14 months; email plus configured sensitive query parameters are redacted; manual SPA and outbound-click tracking are de-duplicated; `form_name`, `lead_type`, and `link_source` are registered; and only the direct `contact_lead` event is marked as an editable lead key event.
- [x] Rechecked public credential evidence. [Realtor.com](https://www.realtor.com/realestateagents/659c35c962a5ff070b97f4b8) and the [brokerage roster](https://www.plum-realestate.com/agents.php) display a REALTOR® claim for Arthur, and Arthur confirmed active membership on July 18, 2026. Private membership and MLS identifiers are not recorded here.
- [x] Scheduled the Codex automation `Quarterly South Jersey Compliance Review` to run every three months on the 18th at 9:00 AM local time, beginning October 18, 2026.
- [x] Re-ran the audit phrase and contact scans, production build, 73 unit tests, 49 tracked database checks, and 37 Playwright checks after implementing the Counties and Connect hubs plus the Google analytics, crawler, schema, sitemap, and media remediations.

This technical record does not satisfy the broker, owner, credential-holder, or legal approvals below.

## Not Applicable Yet

- **Property listings/search:** Not implemented and not part of the current site roadmap. Any future listing-data project requires a separate compliance review and is tracked outside this checklist in [bright-idx-backlog.md](./bright-idx-backlog.md).
- **Automated marketing calls/texts:** Not implemented. The ordinary inquiry expressly excludes that consent.
- **Paid provider cards:** None are published. Any future paid entry must display both `Sponsored` and `Paid advertisement` and pass relationship/payment review first.
- **Reviews/testimonials, awards, designations, and multi-agent roster:** These features are not currently rendered. Their audit requirements become applicable before they are added.
- **Age-restricted community claims:** None remain in the compiled community content.

## Human Decisions Still Required

- [x] The owner reports that the broker has given broad consent to make the changes needed for this site. Exact final wording signoff has not been recorded below.
- [x] The owner's attorney reviewed the site's compliance presentation and advised reducing repeated, overly explanatory copy. The site now uses a layered disclosure approach; this feedback is not recorded as approval of every exact sentence.
- [ ] Broker of record approves the exact broker name, descriptor, office phone/address, disclosure hierarchy, and placement.
- [ ] Broker or New Jersey counsel approves the Fair Housing statement and Equal Housing Opportunity treatment.
- [ ] Broker or New Jersey counsel approves the Privacy Policy, Terms of Service, Disclaimer, ordinary-inquiry authorization, and newsletter consent.
- [x] Owner confirms the public HomeBase CRM relationship wording: HomeBase CRM is owned by Fat Cat Finance, LLC, the company credited with creating and maintaining this website; it appears as a separate technology vendor, the directory entry is unpaid, and it shares no ownership with this website or the affiliated brokerage.
- [ ] Broker confirms there is no referral, affiliate, family, or transaction-based arrangement omitted from either current directory entry.
- [ ] Counsel reviews any future settlement-service advertising or affiliated-business arrangement before publication.
- [ ] A responsible human confirms the tracker/processor inventory against the production Cloudflare, Supabase, Brevo, and GA4 dashboards.
- [x] Current REALTOR® membership is treated as owner-verified and publicly corroborated; the mark is restored without storing private membership identifiers.
- [x] Schedule a quarterly review of license status, broker/office facts, credentials, processors/trackers, provider relationships, and public claims.

## Signoff Record

Exact brokerage name verified by: ____________________  Date: __________

Licensed office phone verified by: ____________________  Date: __________

Office address verified by: ____________________  Date: __________

Agent license and affiliation verified by: ____________________  Date: __________

Privacy/tracker inventory completed by: ____________________  Date: __________

Provider relationships and agreements reviewed by: ____________________  Date: __________

Broker of record approval: ____________________  Date: __________

Legal review, if obtained: ____________________  Date: __________

Final rendered-site audit: ____________________  Date: __________

Codex technical reverification: completed  Date: July 18, 2026

Status: Approved / Approved with changes / Not approved
