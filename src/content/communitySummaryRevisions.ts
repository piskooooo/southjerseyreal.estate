import legacyData from "./legacyCommunitySummaries.json";
import type { ContentBlock, SitePage } from "./types";

export const COMMUNITY_SUMMARIES_VERSION = 1;

type LegacySummary = {
  id: string;
  summary: string;
  sources: ContentBlock[];
};

// This frozen baseline is comparison data, never a rendering fallback.
const legacyCounties = legacyData.counties as Record<string, LegacySummary[]>;
const legacyByCounty = new Map(Object.entries(legacyCounties).map(([path, entries]) => [
  path,
  new Map(entries.map((entry) => [entry.id, entry])),
]));

const matchesSource = (block: ContentBlock, source: ContentBlock) => (
  block.tag === source.tag && block.text === source.text
  && block.href === source.href && block.accessed === source.accessed
);

// Upgrade only the unchanged, previously published checklist summaries.
// Custom paragraphs, source notes, town order, and removed cards remain intact.
export function upgradeCommunitySummaries(page: SitePage, seed: SitePage) {
  const legacy = legacyByCounty.get(page.path);
  if (!legacy) return;
  const seedSections = new Map(seed.sections.map((section) => [section.id, section]));
  let upgraded = false;

  for (const section of page.sections) {
    if (section.kind !== "town") continue;
    const previous = legacy.get(section.id);
    const current = section.blocks[1];
    const seedSection = seedSections.get(section.id);
    const replacement = seedSection?.blocks[1];
    if (!previous || current?.tag !== "P" || current.text !== previous.summary
      || replacement?.tag !== "P" || replacement.text === previous.summary) continue;

    current.text = replacement.text;
    section.blocks = section.blocks.filter((block) => (
      !previous.sources.some((source) => matchesSource(block, source))
    ));
    const existingHrefs = new Set(section.blocks.filter((block) => block.tag === "SOURCE").map((block) => block.href));
    section.blocks.push(...structuredClone((seedSection?.blocks || []).filter((block) => (
      block.tag === "SOURCE" && !existingHrefs.has(block.href)
    ))));
    upgraded = true;
  }

  if (upgraded) {
    const previousDate = "Community profiles updated August 10, 2026.";
    const seedIntro = seed.sections.find((section) => section.kind === "intro");
    const intro = page.sections.find((section) => section.id === seedIntro?.id);
    const date = intro?.blocks.find((block) => block.tag === "P" && block.text === previousDate);
    const replacement = seedIntro?.blocks.find((block) => block.tag === "P" && block.text.startsWith("Community profiles updated "));
    if (date && replacement) date.text = replacement.text;
  }
}
