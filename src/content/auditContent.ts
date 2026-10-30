import type { InsightSection } from "./insights";
import type { ContentBlock } from "./types";

export const municipalGuidePath = "/insights/municipal-records-permits-and-zoning";
export const municipalExample: InsightSection = {
  heading: "A local example: researching a Cherry Hill home",
  paragraphs: [
    "Suppose you are considering a Cherry Hill home with an existing deck and would like to add a shed. This is an illustrative research exercise, not a report on a particular property or a determination that either improvement is approved. Resources checked October 30, 2026.",
    "First, confirm the municipality, block, and lot. Cherry Hill's GIS Mapping page links to its public information and zoning maps. Record the zoning district as a starting point, then use the township's Zoning page to find the ordinance and guidance for decks and sheds. Describe the proposed shed's size and location when asking the zoning office what needs review.",
    "Next, follow Check a Building Permit on the township website. Its permit portal requires a login; a map result alone will not answer the permit-history question. Compare any available deck records with the seller's documents, and ask the responsible office about missing records, final inspections, or unresolved work. Do not interpret an empty search as approval.",
    "Keep two questions separate: what records explain the existing deck, and what approvals would be needed for the proposed shed? Bring the unanswered questions and any transaction deadlines to the appropriate professionals before relying on either assumption. The official starting pages are linked in Sources and review record below.",
  ],
  checklist: [
    "Record the parcel identifiers and the date each source was checked.",
    "Compare the existing deck's documents with available permit records.",
    "Ask the zoning office about the proposed shed before assuming it can be added.",
  ],
};

export const municipalExampleSources: ContentBlock[] = [
  { tag: "SOURCE", text: "Cherry Hill Township — GIS Mapping", href: "https://www.chnj.gov/1027/GIS-Mapping", accessed: "2026-10-30" },
  { tag: "SOURCE", text: "Cherry Hill Township — Zoning and project guidance", href: "https://www.chnj.gov/203/Zoning", accessed: "2026-10-30" },
  { tag: "SOURCE", text: "Cherry Hill Township — Check a Building Permit (portal login required)", href: "https://www.chnj.gov/1023/Check-a-Building-Permit", accessed: "2026-10-30" },
];

export const zoningDirectorySource: ContentBlock = {
  tag: "SOURCE",
  text: "New Jersey Department of Community Affairs — Zoning Map and Ordinance Directory (Excel download)",
  href: "https://www.nj.gov/dca/library/home/Zoning_Information_Directory.xlsx",
  accessed: "2026-10-30",
};

// Exact excerpt from the October 20 Drive issue. No private handoff or reader data.
export const newsletterSample = {
  visible: true,
  heading: "A taste of the newsletter",
  dateLabel: "Excerpt · October 20, 2026",
  paragraphs: [
    "For buyers, compare the full payment and the terms available on the specific home. For sellers, look closely at nearby competing listings and recent sales before setting a price.",
    "A little more flexibility can help both sides reach a workable agreement. The best starting point is still the property, the neighborhood, and the numbers that fit your situation.",
  ],
};
