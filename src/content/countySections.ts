import type { PageSection } from "./types";

export const isActionSection = (section: PageSection) => {
  if (section.kind === "action") return true;
  const headings = section.blocks.filter((block) => block.tag === "H2").map((block) => block.text);
  return headings.includes("Thinking of Selling?") && headings.includes("Looking to Buy?");
};

export const isTownSection = (section: PageSection, index: number) => (
  section.kind === "town" || (index > 0 && section.images.length > 0 && !isActionSection(section))
);

export const townSectionKey = (section: PageSection, index: number) => section.id || String(index);

export const townSectionAnchor = (section: PageSection, index: number) => {
  const heading = section.blocks.find((block) => ["H2", "H3"].includes(block.tag))?.text || "";
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `community-${index + 1}`;
};
