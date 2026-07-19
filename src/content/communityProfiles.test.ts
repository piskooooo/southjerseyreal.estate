import { describe, expect, it } from "vitest";
import { applyCommunityProfiles, communityProfileUpdated } from "./communityProfiles";
import { generatedPages } from "./generatedSiteData";

describe("community profile restoration", () => {
  const pages = applyCommunityProfiles(generatedPages);
  const townSections = pages.flatMap((page) => page.sections.filter((section) => section.kind === "town"));

  it("restores every county and community profile from the sourced editorial draft", () => {
    expect(communityProfileUpdated).toBe("2026-07-19");
    expect(pages).toHaveLength(7);
    expect(townSections).toHaveLength(166);
    expect(pages.every((page) => {
      const titles = page.sections
        .filter((section) => section.kind === "town")
        .map((section) => section.blocks[0]?.text);
      return new Set(titles).size === titles.length;
    })).toBe(true);
    expect(townSections.every((section) => section.blocks.some((block) => block.tag === "SOURCE"))).toBe(true);
    expect(townSections.every((section) => section.blocks[1]?.text.length > 60)).toBe(true);
  });

  it("replaces the stale Pine Valley card title", () => {
    const camden = pages.find((page) => page.path === "/camden-county");
    const titles = camden?.sections.map((section) => section.blocks[0]?.text) || [];
    expect(titles).toContain("Pine Hill (including the former Pine Valley Borough)");
    expect(titles).not.toContain("Pine Hill & Pine Valley");
  });

  it("keeps similarly named municipality types distinct", () => {
    const atlantic = pages.find((page) => page.path === "/atlantic-county");
    const titles = atlantic?.sections
      .filter((section) => section.kind === "town")
      .map((section) => section.blocks[0]?.text) || [];

    expect(titles).toContain("Egg Harbor City");
    expect(titles).toContain("Egg Harbor Township");
  });
});
