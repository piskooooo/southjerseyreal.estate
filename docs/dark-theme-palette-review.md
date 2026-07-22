# Dark Theme Palette Review

Status: Midnight Editorial candidate implemented July 22, 2026; awaiting final
owner visual approval.

## Selected Direction: Midnight Editorial

The owner reopened the dark-theme work after approving the site's sharper,
American Apparel-inspired editorial redesign. The implemented candidate keeps
the open layouts, oversized grotesk typography, square controls, full-color
photography, and rule-separated directories intact while giving dark mode a
clearer hierarchy.

Midnight Editorial adapts the earlier Atlantic Signal option rather than using
it verbatim. A deeper blue-black canvas supports warm-white type; Atlantic blue
identifies the brand, links, numbering, and secondary controls; State Buff is
reserved for primary actions; and Goldfinch Yellow remains a focus-only signal.
Forms now use dark integrated fields instead of switching to bright white.

| Token | Value | Intended role |
| --- | --- | --- |
| Canvas | `#0A0E14` | Page and footer background |
| Surface | `#111821` | Fields, menus, and quiet hover regions |
| Strong surface | `#17222E` | Open menus and cookie controls |
| Sunken surface | `#06090D` | Deep supporting bands |
| Primary text | `#F7F5EF` | Headings and body text |
| Muted text | `#B9C3CE` | Supporting copy and metadata |
| Editorial rule | `#405266` | Section dividers and low-emphasis boundaries |
| Field boundary | `#60758A` | Form-control definition |
| Brand and link | `#78ADD0` | Brand, links, numbering, and secondary interaction |
| Primary action | `#D7BD7A` | Contact and primary submit actions |
| Action text | `#0A0E14` | Text on State Buff actions |
| Focus | `#F0D32B` | Keyboard focus only |
| Success | `#A9D49E` | Confirmed states |
| Warning | `#E6C46F` | Caution states |
| Error | `#F4A6B8` | Validation and destructive states |

## Audit Summary

The current dark theme is highly legible, restrained, and consistent. Its main
weakness is hierarchy rather than accessibility:

- The canvas, card surface, strong surface, and sunken surface are separated by
  very small luminance steps. The canvas-to-card ratio is only `1.10:1`.
- Brand, link, focus, transit, and most interaction roles all resolve to nearly
  the same white. Users can read the interface, but color does little to explain
  what is interactive, selected, or regionally distinctive.
- Public form fields switch to bright white. They are clear, but the jump from
  charcoal to white is stronger than the rest of the interface.
- Error text has good contrast, but the public theme has no dedicated success
  or warning tokens.
- The dark theme does not yet carry the Garden State Signal identity already
  present in the light theme.
- The private `/admin` interface is intentionally light-only and is outside the
  scope of these dark-theme options.

All three options below preserve the site's neutral foundation, add stronger
surface separation, and assign distinct semantic roles to links, actions,
focus, success, warning, and error states. None is applied to `src/styles.css`.

## Option A: Pine and Gold

Recommended starting point. This option is grounded and local without making
the site read as green. Pitch-pine neutrals carry the surfaces, State Buff
carries primary actions, Atlantic blue identifies links, and Goldfinch Yellow
is reserved for focus.

| Token | Value | Intended role |
| --- | --- | --- |
| Canvas | `#171B18` | Page background |
| Surface | `#293229` | Cards, panels, and forms |
| Strong surface | `#334033` | Open and selected regions |
| Sunken surface | `#0E120F` | Footer and brokerage bands |
| Primary text | `#F7F8F6` | Headings and body text |
| Muted text | `#BEC9C0` | Supporting copy and metadata |
| Brand accent | `#91B49A` | Brand and natural details |
| Link | `#8FC2DF` | Links and secondary actions |
| Primary action | `#D7BD7A` | Buttons and selected controls |
| Action text | `#171717` | Text on primary actions |
| Focus | `#F0D32B` | Keyboard focus and one high-energy highlight |
| Success | `#A9D49E` | Confirmed and completed states |
| Warning | `#E6C46F` | Caution states |
| Error | `#F4A6B8` | Validation and destructive states |

## Option B: Atlantic Signal

The clearest continuation of the light theme. Cool graphite surfaces reference
the coast without becoming a blue-only interface. Jersey Blue leads actions,
Atlantic Teal leads links, Buff warms supporting details, and yellow remains a
focus-only signal.

| Token | Value | Intended role |
| --- | --- | --- |
| Canvas | `#141A1D` | Page background |
| Surface | `#24323A` | Cards, panels, and forms |
| Strong surface | `#2D3E48` | Open and selected regions |
| Sunken surface | `#0B1013` | Footer and brokerage bands |
| Primary text | `#F7F8F6` | Headings and body text |
| Muted text | `#BAC7CD` | Supporting copy and metadata |
| Brand accent | `#78ADD0` | Brand and primary action color |
| Link | `#82C7CA` | Links and secondary actions |
| Primary action | `#78ADD0` | Buttons and selected controls |
| Action text | `#101619` | Text on primary actions |
| Focus | `#F0D32B` | Keyboard focus and selected highlight |
| Success | `#9FC99B` | Confirmed and completed states |
| Warning | `#E7C274` | Caution states |
| Error | `#F4A6B8` | Validation and destructive states |

## Option C: Cranberry and Sea Glass

The warmest and most editorial option. Plum-charcoal surfaces avoid a brown or
beige cast, Sea Glass leads controls and links, and Cranberry Bog appears only
as a brand detail. This has the strongest candidate surface separation, but it
is also the biggest visual departure from the current site.

| Token | Value | Intended role |
| --- | --- | --- |
| Canvas | `#1A1719` | Page background |
| Surface | `#382D34` | Cards, panels, and forms |
| Strong surface | `#44363E` | Open and selected regions |
| Sunken surface | `#0F0C0E` | Footer and brokerage bands |
| Primary text | `#FAF7F8` | Headings and body text |
| Muted text | `#D0C2C7` | Supporting copy and metadata |
| Brand accent | `#E27A98` | Small brand and editorial details |
| Link | `#A9D5D1` | Links and secondary actions |
| Primary action | `#9FCBC6` | Buttons and selected controls |
| Action text | `#171717` | Text on primary actions |
| Focus | `#F0D32B` | Keyboard focus and selected highlight |
| Success | `#A8D6A3` | Confirmed and completed states |
| Warning | `#EAC77A` | Caution states |
| Error | `#F3A2B6` | Validation and destructive states |

## Contrast Results

Ratios were calculated with the WCAG relative-luminance formula. Normal text
pairs exceed `4.5:1`, and focus/UI pairs exceed `3:1`. Surface separation is
included as a visual hierarchy measurement, not a WCAG text requirement.

| Pair | Current | Pine and Gold | Atlantic Signal | Cranberry and Sea Glass |
| --- | ---: | ---: | ---: | ---: |
| Primary text / canvas | `16.33:1` | `16.34:1` | `16.49:1` | `16.71:1` |
| Muted text / canvas | `10.29:1` | `10.20:1` | `10.16:1` | `10.35:1` |
| Primary text / surface | `14.87:1` | `12.46:1` | `12.38:1` | `12.38:1` |
| Action text / action | `14.86:1` | `9.77:1` | `7.55:1` | `10.10:1` |
| Link / canvas | `16.33:1` | `9.08:1` | `9.18:1` | `11.12:1` |
| Focus / canvas | `16.33:1` | `11.65:1` | `11.76:1` | `11.91:1` |
| Error / canvas | `10.39:1` | `9.11:1` | `9.20:1` | `9.03:1` |
| Surface / canvas | `1.10:1` | `1.31:1` | `1.33:1` | `1.35:1` |

## Recommendation

Midnight Editorial is now the recommended production direction. It has the
cool clarity of Atlantic Signal, the action warmth of Pine and Gold, and enough
contrast to support the new editorial system without becoming a blue-only or
green-tinted interface. The earlier three options remain below as historical
research. Final acceptance depends on the owner's visual review of the
implemented desktop and mobile site.
