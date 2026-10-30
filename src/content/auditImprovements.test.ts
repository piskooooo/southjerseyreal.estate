import { describe, expect, it } from "vitest";
import { managedContentSeeds, normalizeManagedContent, type ManagedPageDocument } from "./siteEditor";

const path = "/insights/municipal-records-permits-and-zoning";
const heading = "A local example: researching a Cherry Hill home";
const legacySource = { tag: "SOURCE", text: "New Jersey Department of Community Affairs — Zoning Map and Ordinance Directory", href: "https://www.nj.gov/dca/", accessed: "2026-08-10" };

describe("selected audit content", () => {
  it("adds the local walkthrough and direct resource to older saved guides only once", () => {
    const old = structuredClone(managedContentSeeds.get(path)) as ManagedPageDocument;
    delete (old as unknown as Record<string, unknown>).municipalExampleVersion;
    old.insightArticle!.sections = old.insightArticle!.sections.filter(s => s.heading !== heading);
    old.insightArticle!.sources = [legacySource];
    const before = structuredClone(old);
    const upgraded = normalizeManagedContent(path, old) as ManagedPageDocument;
    expect(upgraded.insightArticle!.sections.some(s => s.heading === heading)).toBe(true);
    expect(upgraded.insightArticle!.sources.some(s => s.href?.endsWith("Zoning_Information_Directory.xlsx"))).toBe(true);
    expect(old).toEqual(before);
    upgraded.insightArticle!.sections = upgraded.insightArticle!.sections.filter(s => s.heading !== heading);
    expect((normalizeManagedContent(path, upgraded) as ManagedPageDocument).insightArticle!.sections).toEqual(upgraded.insightArticle!.sections);
  });

  it("preserves edited source notes and section order during the upgrade", () => {
    const old = structuredClone(managedContentSeeds.get(path)) as ManagedPageDocument;
    delete (old as unknown as Record<string, unknown>).municipalExampleVersion;
    old.insightArticle!.sections = [{ heading: "Owner's research", paragraphs: ["Owner's wording."], checklist: [] }];
    old.insightArticle!.sources = [{ ...legacySource, text: "Owner's source description" }];
    const upgraded = normalizeManagedContent(path, old) as ManagedPageDocument;
    expect(upgraded.insightArticle!.sections[0]).toEqual(old.insightArticle!.sections[0]);
    expect(upgraded.insightArticle!.sources[0]).toEqual(old.insightArticle!.sources[0]);
  });
});
