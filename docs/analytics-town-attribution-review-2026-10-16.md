# Town attribution and Camden/Atlantic traffic review

Reviewed October 16, 2026, using America/New_York for GA4 dates.

## Verified completion

Consent-gated town-interest tracking is already published in `e003c1f`, with
production verification recorded in `9bc0cfb`. The prior release passed 176
unit tests, 82 browser/compliance checks, GitHub CI, and Cloudflare deployment.
The labeled production check verified Google accepted a Camden City profile
opening and subsequent Contact click; it submitted no inquiry.

The GA4 Admin API now independently authenticates and lists these exact
definitions on **Main Website**, property `498019272`, measurement ID
`G-97H86MNHP8`:

| Dimension | Event parameter | Scope |
| --- | --- | --- |
| County | `county_id` | Event |
| Town | `community_id` | Event |
| Profile open method | `open_method` | Event |

The read-only plan skips all three as already present. The existing Link
source, Lead type, and Form name definitions are also present. The dedicated
CLI service account has Viewer access only on this property; connector writes
remain disabled. No duplicate dimensions, extra website deployment, new form
fields, or database changes were needed for this completion.

This verifies settings and API access, not populated town reports. Google
advises allowing [24–48 hours after custom data and dimension creation](https://support.google.com/analytics/answer/14239696)
before using the dimension in reports.

## Evidence and interpretation

Connected Windsor sources were GA4 **Main Website** (`498019272`) and Search
Console **`sc-domain:southjerseyreal.estate`**. A freshness query through
October 15 returned Search Console rows through October 14 and GA4 activity
through October 15. The consistent historical comparison below uses July
16–October 13 and September 16–October 13; neither includes the October 16
production tracking test. Returned dates establish available coverage, not
that every possible event or search is represented.

| Measure | July 16–October 13 | September 16–October 13 |
| --- | ---: | ---: |
| Search Console property impressions | 8,196 | 1,010 |
| Search Console property clicks | 11 | 1 |
| GA4 sessions, including labeled QA | 59 | 8 |
| GA4 engaged sessions, including labeled QA | 11 | 0 |

Search impressions are appearances in search results, not website visits.
GA4 covers consented, successfully collected activity and is a different
population; do not join these counts into a conversion funnel.

Across July 16–October 13, the Camden county page had **1,934 impressions and
zero clicks**. Atlantic had **471 impressions and one click**. Camden's
September 14–15 spike contributed **1,201 impressions**, about 62% of its
period total, with zero clicks. Available query rows for that spike cover only
127 impressions; 118 are Pine Valley government/official-site terms. This
small visible subset does not explain all 1,201 impressions or establish
buyer/seller demand.

The 59 GA4 sessions include four explicitly labeled `codex`/`codex_test` QA
sessions. The two historical key events include a `contact_lead` tagged
`codex_test / qa` and an older `generate_lead` whose customer status cannot be
verified. Neither establishes a genuine seller conversion.
September 16–October 13 contains no observed engaged sessions or contact
events. These sparse observations are insufficient to identify a reliable
town, page, or channel that produces qualified inquiries.

The main observed traffic source is Facebook referral traffic, predominantly
to the newsletter page, rather than demonstrated Camden/Atlantic interest:

| GA4 session source / medium | Sessions | Engaged sessions |
| --- | ---: | ---: |
| `m.facebook.com / referral` | 33 | 0 |
| `facebook.com / referral` | 12 | 1 |
| `google / organic` | 4 | 3 |
| `(direct) / (none)` | 6 | 3 |

This table excludes the four explicitly labeled QA sessions and covers July
16–October 13. The newsletter page was the landing page for 42 sessions,
all from the two Facebook referral sources, with one engaged session.
Google organic's three engaged sessions out of four are a small signal to
investigate, not a dependable channel conversion rate. There are no Camden
or Atlantic county landing-page rows in this GA4 extract. That absence does
not negate Search Console's clicks, because coverage and measurement differ.

Atlantic's visible buyer-intent searches include `atlantic county nj real
estate` (76 impressions, zero clicks, average position 33.82) and `atlantic
county nj homes for sale` (62 impressions, zero clicks, average position
30.39). Those terms are relevant to the business but show limited visibility.
Search Console query rows are incomplete, and changing query mix can change
page-average positions without proving a general ranking improvement.

Historical towns are expandable profiles inside county URLs, so page reports
cannot reconstruct which individual town someone viewed or establish a
specific inquiry's source. A visitor's reported city is a geographic estimate,
not the town whose property or content interests them. Missing consented
analytics does not disprove an inquiry or phone call. No private inquiry
records were used in this review.

## Current page findings and next improvements

The owner selected recommendation 1 in the October 16 follow-up; its local
implementation and release status are recorded in `docs/project-todo.md`.
Recommendations 2–4 remain proposed changes. Preserve structured editable
content, existing disclosures, source notes, approved imagery, and working
deep links. The production observations below describe the audit before that
local implementation.

1. **Include reviewed town content in the initial county HTML.** Live Camden
   and Atlantic pages render 34 and 23 town profiles respectively after
   JavaScript; their initial HTTP responses contain no town cards or fragment
   links. `scripts/prerender-seo.mjs` currently emits an abbreviated shell.
   Include existing reviewed headings, summaries, sources, and stable anchors
   in generated HTML. Acceptance: 34/34 and 23/23 profile coverage in the
   respective HTTP responses, with matching hydrated content and working
   anchors. Google can render JavaScript, so this finding does not prove the
   towns are unindexed or promise higher rankings. See Google's
   [JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
2. **Expose the existing town anchors in a compact directory and share
   controls.** At 390 × 844, the county pages measured about 9,147 pixels
   (Camden) and 7,371 pixels (Atlantic) high. There is no visible per-town
   permalink control. Existing Cherry Hill and Hamilton Township/Mays Landing
   deep links already open and scroll to the correct profile. Acceptance:
   each directory/share destination opens the right profile, supports keyboard
   use, and preserves `anchor`/`manual` analytics without extra counted opens.
   Compare observed town opens and town-context contact actions; do not call
   an anchor opening proof of an external share.
3. **Link county readers directly to relevant existing guides.** Neither
   county page currently links to an individual Insights article. Use the
   [seller guide](https://southjerseyreal.estate/insights/preparing-to-sell-a-new-jersey-home),
   [coastal due-diligence guide](https://southjerseyreal.estate/insights/coastal-property-due-diligence),
   and [municipal-records guide](https://southjerseyreal.estate/insights/municipal-records-permits-and-zoning)
   where relevant. Acceptance: useful contextual links on Camden/Atlantic
   and no generic replacement of other counties' content. Measure county-to-
   article clicks and subsequent contact actions as exploratory evidence,
   retaining the consent and small-sample limits.
4. **Correct the identified summary defects before adding more copy.**
   Clementon, Lindenwold, Merchantville, and Voorhees repeat identical sentences
   in different summary categories. Egg Harbor City contains a grammar defect.
   Repair only the affected wording, checking primary sources for changed
   factual claims and retaining historical labels. Acceptance: no repeated
   category sentences in those cards, readable wording, and dated source
   records. This is a content-quality correction, not a promised traffic gain.

The inspected public pages were
[Camden County](https://southjerseyreal.estate/camden-county) and
[Atlantic County](https://southjerseyreal.estate/atlantic-county). The review
used raw HTTP responses and a rendered mobile browser without analytics
opt-in or form submissions.

## Measurement plan

- Check report availability on or after October 19. Begin with event name,
  County, Town, and Profile open method; retain an explicit unknown/unset
  bucket rather than inferring missing towns from visitor geography.
- Use October 19–November 15 as the first proposed 28-day observation window,
  then November 16–December 13 for an equal-length comparison. These are review
  dates, not a scheduled automation or a guarantee of sufficient traffic.
  Record the release date of any later selected website change and choose
  complete comparison windows around that release; a calendar change alone
  cannot establish an improvement's effect.
- Separate `community_profile_open`, contact-page link clicks, approved
  phone/email clicks, and `contact_lead`. Only `contact_lead` represents a
  successful website inquiry under the current contract. Do not add
  `generate_lead` to it or treat phone-link clicks as confirmed calls.
- Break events down by town and compare landing-page/session-channel reports
  separately. The last viewed town is context, not proof that it caused an
  inquiry. Context is in memory, expires after 30 minutes without tracked
  activity, and is lost on reload/new tabs or consent withdrawal.
- Exclude labeled QA from customer reporting. For future owner-shared
  marketing links, use consistent campaign tags; keep untagged/direct traffic
  unknown. Judge Facebook links by engaged sessions and completed inquiries,
  rather than treating newsletter landing volume as useful town traffic.
  Do not send personal inquiry details as event parameters.
- Keep Search Console page and query views separate. Evaluate buyer/seller
  query relevance, clicks, and impressions over comparable windows; preserve
  partial-query and reporting-lag caveats. If volumes remain small, report
  counts and continue observing rather than choosing a winning town from
  unstable percentages.

There is no remaining GA4 setup blocker. Report processing and real consented
activity are still needed to evaluate the new dimensions. Recommendation 1
has been selected for implementation; the remaining website recommendations
require owner selection. The completed original roadmap remains closed.

## Local audit evidence

The aggregate query results and executed calculation checks are retained
outside the website repository. The accompanying chat's Sources receipt
contains the inspectable aggregate evidence. Raw analytics extracts, private
inquiry records, credentials, and local audit paths are not committed here.
