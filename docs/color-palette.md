# Color Palette Foundation

Status: approved light design and owner-approved Midnight Editorial dark theme.

## Direction

The working direction is **Garden State Signal**: preserve the site's restrained
monochrome foundation, use New Jersey state colors for its regional identity,
draw natural highlights from the eastern goldfinch, reflect the Shore and Pine
Barrens through contextual landscape colors, and reserve NJ TRANSIT and PATCO
colors for small flashes of South Jersey character.

The palette should feel polished and regional without resembling a state agency
or transit website.

## Existing Neutral Foundation

The site's current neutrals remain the dominant colors.

| Name | Hex | Role |
| --- | --- | --- |
| Night | `#1C1C1C` | Dark-mode canvas |
| Ink | `#171717` | Light-mode text and dark text on bright fills |
| Warm White | `#F7F8F6` | Light-mode canvas |
| Wing White | `#FAFAFA` | Dark-mode text and light content |

## Core Regional Palette

These are source-inspired web colors, not claimed to be official government
color specifications.

| Name | Hex | Inspiration | Intended role |
| --- | --- | --- | --- |
| Jersey Blue | `#1C4F73` | Dark "Jersey blue" on the state flag | Primary actions, links, active navigation, and strong accents |
| State Buff | `#D7BD7A` | Buff field of the state flag | Warm section bands, callouts, and subtle borders |
| Goldfinch Yellow | `#F0D32B` | Eastern goldfinch breeding plumage | Focus rings, selected states, highlights, and occasional featured calls to action |
| Meadow Olive | `#5C662E` | Female goldfinch plumage and New Jersey meadow habitat | Guide details, tags, metadata, and natural secondary accents |

Buff and Goldfinch Yellow have separate jobs. Buff is a quiet surface color;
yellow is a high-energy highlight and should remain comparatively rare.

## Regional Landscape Extensions

These colors add a stronger sense of place without changing the sitewide brand
colors. They should appear when the page or subject supports the association,
not as a second palette competing with Jersey Blue, State Buff, and Goldfinch
Yellow.

| Name | Hex | Inspiration | Intended role |
| --- | --- | --- | --- |
| Atlantic Teal | `#236D75` | Atlantic water, bays, and coastal wetlands | Shore-guide accents, maps, links, and supporting data graphics |
| Sea Glass | `#9FCBC6` | Shallow coastal water and weathered sea glass | Soft Shore surfaces, selected-card backgrounds, and quiet illustration fields |
| Pitch Pine | `#304C3A` | Pitch pine and pine-oak forest canopy | Pine Barrens guide accents, headings, and grounded natural details |
| Cedar Water | `#754B3A` | Tea-colored Pinelands streams and cedar swamps | Small editorial rules, map details, and historical or ecological callouts |
| Cranberry Bog | `#9B3652` | Pinelands cranberry bogs and agricultural history | Occasional highlights, chart series, or seasonal editorial accents |

Several Shore and Pinelands references already belong to the core palette:
State Buff can also represent dune and white-sand tones, Meadow Olive can
represent dune grass and scrub understory, and the existing warm whites can
represent shell and sea-foam tones. Reuse those colors instead of creating
near-duplicate swatches.

Atlantic Teal or Pitch Pine may lead a context-specific guide, but common site
controls should continue to use Jersey Blue. Do not place the Shore, Pine
Barrens, goldfinch, and transit accents together in one section.

## Transit Flare

The following colors were sampled from raster logos served by the official NJ
TRANSIT and PATCO websites. They are reference swatches, not published brand
standards.

| Name | Hex | Intended role |
| --- | --- | --- |
| NJT Orange | `#F36B29` | Primary South Jersey transit flare for small rules, icons, and hover details |
| PATCO Crimson | `#D11241` | Local transit accent for occasional graphic details |
| NJT Magenta | `#A10A79` | Optional decorative accent used very sparingly |
| NJT Blue | `#013D88` | Optional accent for maps, data graphics, or a rare transit reference |

NJ TRANSIT's own design system associates orange with South Jersey and blue
with North Jersey, so orange is the most regionally appropriate NJ TRANSIT
accent for this site.

Use transit hues independently. Do not reproduce either agency's logo, mark,
or recognizable stripe arrangement, and do not use PATCO Crimson as the site's
error or destructive-action color.

## Theme-Aware Roles

The site supports light and dark themes, so semantic colors should adapt rather
than forcing one source swatch into every context.

| Semantic role | Light theme | Dark theme | Text pairing |
| --- | --- | --- | --- |
| Primary interactive | `#1C4F73` | `#78ADD0` | White on light-theme blue; dark canvas behind dark-theme blue text |
| Highlight fill | `#F0D32B` | `#F0D32B` | `#171717` text in both themes |
| Soft regional surface | `#F5EFDF` | `#302C22` | Existing theme text |
| Natural secondary text | `#5C662E` | `#AAB26A` | Existing theme canvas |
| Shore accent | `#236D75` | `#78BFC4` | Existing opposite-theme canvas |
| Shore soft surface | `#9FCBC6` | `#1F3A3B` | `#171717` in light mode; `#FAFAFA` in dark mode |
| Pine accent | `#304C3A` | `#91B49A` | Existing opposite-theme canvas |
| Cedar-water accent | `#754B3A` | `#C18E75` | Existing opposite-theme canvas |
| Cranberry accent | `#9B3652` | `#E27A98` | Existing opposite-theme canvas |

These recommended theme pairings meet WCAG contrast requirements for normal
text against the listed site backgrounds. Transit colors are decorative by
default and need separate contrast checks before being assigned to text,
controls, or status indicators.

## Usage Hierarchy

Use this distribution as a visual guardrail, not a rigid measurement:

- About 80% existing neutrals
- About 12% Jersey Blue and State Buff
- About 5% context-specific landscape colors
- About 2% Goldfinch Yellow and other high-energy highlights
- About 1% transit flare

Landscape colors replace part of the supporting-color budget on relevant pages;
they are not added on top of it.

## Future Application Rules

- Jersey Blue should become the dependable brand and interactive color.
- State Buff should create warmth through quiet backgrounds rather than large,
  saturated blocks.
- Goldfinch Yellow should identify focus, selection, or one especially important
  moment on a page. Never use yellow text on a light surface.
- Meadow Olive should support editorial and place-based content without becoming
  a second primary color.
- Atlantic Teal and Sea Glass should be associated primarily with Shore, bay,
  dune, and coastal-wetland content.
- Pitch Pine, Cedar Water, and Cranberry Bog should be associated primarily with
  Pinelands ecology, communities, history, and agriculture.
- Cranberry Bog and PATCO Crimson are close relatives. Do not use both in the
  same component or as interchangeable semantic colors.
- Transit colors should appear as small signals, such as a thin rule, icon detail,
  chart series, or hover accent, rather than as general-purpose button colors.
- Color must never be the only indicator of meaning. Continue using text, icons,
  borders, or other visible cues for states and actions.
- Every implementation should be reviewed in both themes and checked for text,
  focus-ring, control-boundary, and hover-state contrast.

## Sources

- New Jersey state symbols: <https://www.nj.gov/bpu/nj/about/symbols/>
- NJ TRANSIT design system overview: <https://www.njtransit.com/news-events/whats-my-line>
- NJ TRANSIT logo reference: <https://www.njtransit.com/assets/logo-print.png>
- PATCO logo reference: <https://www.ridepatco.org/images/header_logo.png>
- Cornell Lab American Goldfinch identification: <https://www.allaboutbirds.org/guide/american_goldfinch/id/>
- New Jersey beaches and dunes habitat: <https://dep.nj.gov/swap/habitats/beaches-and-dunes/>
- New Jersey Atlantic Coast region: <https://dep.nj.gov/swap/regions/atlantic-coast/>
- New Jersey Pinelands overview: <https://www.nj.gov/pinelands/cmp/summary/>
- New Jersey Pine Barrens surface water: <https://www.nj.gov/pinelands/infor/educational/curriculum/pinecur/pbsw.htm>

## Implementation Status

The approved light-mode implementation lives in `src/styles.css` and emphasizes
Jersey Blue within the site's black-and-white editorial system. The July 22
Midnight Editorial dark theme uses a blue-black canvas, warm-white type,
Atlantic blue interaction, State Buff actions, and Goldfinch focus states. Dark
form fields, menus, cookie controls, directories, accordions, and the compact
footer share the same semantic tokens. The private `/admin` interface remains
intentionally light-only. Theme work changes color and state treatment only;
site structure, page copy, typography, imagery, and layout remain unchanged.
