import { describe, expect, it } from "vitest";
import { buildGuideFinderEntries, findGuideFinderEntries, getGuideFinderMatch } from "./guideFinder";
import { insightSectionId } from "./insightSections";
import { insightArticles, insightIndex, type InsightArticleContent, type InsightCard } from "./insights";
import { siteUrl } from "./seo";

const documents = Object.entries(insightArticles).map(([path, insightArticle]) => ({ page: { path }, insightArticle }));
const entries = buildGuideFinderEntries(insightIndex.articles, documents);
const inspectionPath = "/insights/home-inspections-and-repair-questions";
const inspectionCard = insightIndex.articles.find((card) => card.href === inspectionPath)!;
const resultHrefs = (query: string) => findGuideFinderEntries(entries, query).map((entry) => entry.card.href);

function matchFixture(articleChanges: Partial<InsightArticleContent> = {}, cardChanges: Partial<InsightCard> = {}) {
  const card: InsightCard = { ...inspectionCard, title: "A working guide", summary: "Research notes", category: "Reference", ...cardChanges };
  const article: InsightArticleContent = {
    ...structuredClone(insightArticles[inspectionPath]),
    title: "Technical reading",
    summary: "An introduction",
    category: "Reference",
    sections: [{ heading: "Equipment records", paragraphs: ["Check the copper fittings."], checklist: [] }],
    sources: [],
    relatedLinks: [],
    ...articleChanges,
  };
  return { card, article, entry: buildGuideFinderEntries([card], [{ page: { path: inspectionPath }, insightArticle: article }])[0] };
}

describe("guide finder full-text coverage", () => {
  it.each([
    ["preapproval", "/insights/new-jersey-homebuying-process"],
    ["lien contacts", "/insights/preparing-to-sell-a-new-jersey-home"],
    ["reporting lag", "/insights/researching-a-south-jersey-property"],
    ["radon", inspectionPath],
    ["accessory dwelling", "/insights/municipal-records-permits-and-zoning"],
    ["daytime showing", "/insights/questions-before-choosing-a-community"],
    ["back-bay", "/insights/coastal-property-due-diligence"],
    ["untreated-water", "/insights/wells-septic-acreage-and-environmental-constraints"],
    ["exclusivity", "/insights/working-with-a-real-estate-agent-in-new-jersey"],
  ])("finds %s inside the complete guide text", (query, expectedHref) => {
    expect(entries).toHaveLength(9);
    expect(resultHrefs(query)).toEqual([expectedHref]);
  });

  it("finds a shared body topic without changing the accepted card order", () => {
    expect(resultHrefs("easements")).toEqual([
      "/insights/researching-a-south-jersey-property",
      "/insights/wells-septic-acreage-and-environmental-constraints",
    ]);
  });

  it("searches all human-readable article fields, including checklists, sources, and related labels", () => {
    const card: InsightCard = { ...inspectionCard, title: "Directory wording", summary: "Card synopsis", category: "Directory category" };
    const article: InsightArticleContent = {
      ...structuredClone(insightArticles[inspectionPath]),
      title: "Article heading",
      summary: "Article introduction",
      category: "Article category",
      author: "Casey Writer",
      eyebrow: "Field notes",
      notice: "Caution about zinc flashing",
      readingTime: "11 minute read",
      publishedDate: "2026-02-03",
      reviewedDate: "2026-10-19",
      sections: [{ heading: "Café–repair questions", paragraphs: ["Check the high-efficiency heat-pump documentation."], checklist: ["Photograph the copper fittings."] }],
      sources: [{ tag: "SOURCE", text: "Aquifer map register", href: "https://example.com/source", accessed: "2026-10-19" }],
      relatedLinks: [{ label: "Review the parcel checklist", href: "/contact" }],
    };
    const accepted = buildGuideFinderEntries([card], [{ page: { path: inspectionPath }, insightArticle: article }]);
    for (const query of [
      "directory wording", "card synopsis", "directory category", "article heading", "article introduction", "article category",
      "Casey Writer", "field notes", "zinc flashing", "11 minute", "2026-02-03", "2026-10-19",
      "CAFE / COPPER", "high—efficiency HEAT pump", "Aquifer register", "parcel checklist",
    ]) {
      expect(findGuideFinderEntries(accepted, query), query).toEqual(accepted);
    }
    expect(findGuideFinderEntries(accepted, "copper absentword")).toEqual([]);
    expect(findGuideFinderEntries(accepted, "other guide")).toEqual([]);
  });

  it.each(["", " \n\t ", "— & / ..."])("keeps all cards for the normalized empty query %j", (query) => {
    expect(findGuideFinderEntries(entries, query)).toEqual(entries);
  });

  it("handles an empty accepted library", () => {
    expect(buildGuideFinderEntries([], documents)).toEqual([]);
    expect(findGuideFinderEntries([], "radon")).toEqual([]);
  });
});

describe("guide finder accepted content and destinations", () => {
  it("respects owner order, removals, and published article edits without reviving compiled text", () => {
    const editedArticle = structuredClone(insightArticles[inspectionPath]);
    editedArticle.title = "Owner inspection notes";
    editedArticle.sections = editedArticle.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.filter((paragraph) => !paragraph.includes("radon")),
    }));
    editedArticle.sections.at(-1)!.paragraphs.push("Owner-reviewed heat-pump installation notes.");
    const cards = [insightIndex.articles[7], { ...inspectionCard, title: "Owner inspection notes" }];
    const accepted = buildGuideFinderEntries(cards, documents.map((document) => (
      document.page.path === inspectionPath ? { ...document, insightArticle: editedArticle } : document
    )));

    expect(accepted.map((entry) => entry.card)).toEqual(cards);
    expect(accepted.map((entry) => entry.index)).toEqual([0, 1]);
    expect(findGuideFinderEntries(accepted, "heat pump installation").map((entry) => entry.card.title)).toEqual(["Owner inspection notes"]);
    expect(findGuideFinderEntries(accepted, "radon")).toEqual([]);
    expect(findGuideFinderEntries(accepted, "back bay")).toEqual([]);
  });

  it("resolves internal and canonical article destinations while preserving query strings, fragments, and card references", () => {
    const cards = [
      { ...inspectionCard, href: `${inspectionPath}?from=directory#inspection-scope` },
      { ...inspectionCard, href: `${siteUrl}${inspectionPath}/#inspection-scope` },
    ];
    const beforeCards = structuredClone(cards);
    const beforeDocuments = structuredClone(documents);
    const accepted = buildGuideFinderEntries(Object.freeze(cards), documents.values());
    const found = findGuideFinderEntries(Object.freeze(accepted), "RADON");

    expect(found.map((entry) => entry.card.href)).toEqual(cards.map((card) => card.href));
    expect(found.map((entry) => entry.index)).toEqual([0, 1]);
    expect(found[0].card).toBe(cards[0]);
    expect(found[1].card).toBe(cards[1]);
    expect(cards).toEqual(beforeCards);
    expect(documents).toEqual(beforeDocuments);
  });

  it("does not borrow local article text for external, invalid, or nonarticle destinations", () => {
    const hrefs = [
      `https://elsewhere.example${inspectionPath}`,
      `https://reader@southjerseyreal.estate${inspectionPath}`,
      `//elsewhere.example${inspectionPath}`,
      `insights/home-inspections-and-repair-questions`,
      "/faq#buy",
      "/insights/not-an-accepted-article",
      "mailto:reader@example.com",
      "/insights/invalid\\destination",
    ];
    const cards = hrefs.map((href, index) => ({ ...inspectionCard, title: `Outside resource ${index}`, summary: "A separate destination", category: "Other", href }));
    const accepted = buildGuideFinderEntries(cards, [...documents, { page: { path: "/faq" } }]);

    expect(findGuideFinderEntries(accepted, "radon")).toEqual([]);
    expect(findGuideFinderEntries(accepted, "outside resource").map((entry) => entry.card.href)).toEqual(hrefs);
  });
});

describe("guide finder matching excerpts and sections", () => {
  it.each([
    ["preapproval", "/insights/new-jersey-homebuying-process", "Start with the whole housing budget"],
    ["lien contacts", "/insights/preparing-to-sell-a-new-jersey-home", "Build a property file before the listing appointment"],
    ["reporting lag", "/insights/researching-a-south-jersey-property", "Confirm the parcel before comparing the facts"],
    ["radon", inspectionPath, "Decide what each inspection should answer"],
    ["accessory dwelling", "/insights/municipal-records-permits-and-zoning", "Read zoning information as a prompt for questions"],
    ["daytime showing", "/insights/questions-before-choosing-a-community", "Visit at more than one useful time"],
    ["back-bay", "/insights/coastal-property-due-diligence", "Start with the exact property, not a broad shore label"],
    ["untreated-water", "/insights/wells-septic-acreage-and-environmental-constraints", "Treat private wells as a water-quality question"],
    ["exclusivity", "/insights/working-with-a-real-estate-agent-in-new-jersey", "Read the agreement before the work gets underway"],
  ])("shows %s from the current body and links its actual section", (query, path, heading) => {
    const entry = findGuideFinderEntries(entries, query).find((found) => found.card.href === path)!;
    const match = getGuideFinderMatch(entry, query)!;
    expect(match.excerpt.toLowerCase()).toContain(query);
    expect(match.excerpt.length).toBeLessThanOrEqual(220);
    expect(match.sectionHeading).toBe(heading);
    expect(match.sectionHref).toBe(`${path}#${insightSectionId(heading, 0)}`);
    expect(entry.card).toBe(insightIndex.articles[entry.index]);
  });

  it.each(["", " \n\t ", "— & / ...", "absentword"])('has no excerpt for the inactive or unmatched query %j', (query) => {
    expect(getGuideFinderMatch(entries[0], query)).toBeUndefined();
  });

  it("uses the strongest passage and prefers body text over metadata on a tie", () => {
    const { entry } = matchFixture({
      title: "Copper equipment",
      sections: [
        { heading: "First records", paragraphs: ["Check copper first."], checklist: [] },
        { heading: "Later records", paragraphs: ["Check copper equipment carefully."], checklist: ["Photograph the copper equipment label."] },
      ],
    });
    expect(getGuideFinderMatch(entry, "copper equipment")).toEqual({
      excerpt: "Check copper equipment carefully.",
      sectionHeading: "Later records",
      sectionHref: `${inspectionPath}#later-records`,
    });
    expect(getGuideFinderMatch(entry, "copper")).toEqual({
      excerpt: "Check copper first.",
      sectionHeading: "First records",
      sectionHref: `${inspectionPath}#first-records`,
    });
  });

  it("links a section whose heading, paragraphs, and checklist collectively contain the query", () => {
    const { entry } = matchFixture({
      sections: [{ heading: "Café–repair questions", paragraphs: ["Check the high-efficiency heat-pump documentation."], checklist: ["Photograph the copper fittings."] }],
    });
    expect(getGuideFinderMatch(entry, "CAFE / COPPER")).toEqual({
      excerpt: "Café–repair questions",
      sectionHeading: "Café–repair questions",
      sectionHref: `${inspectionPath}#caf-repair-questions`,
    });
    expect(getGuideFinderMatch(entry, "high—efficiency HEAT pump")?.excerpt).toBe("Check the high-efficiency heat-pump documentation.");
  });

  it("shows context without inventing a section for queries spread across sections or metadata", () => {
    const { entry } = matchFixture({
      notice: "A zinc caution",
      sections: [
        { heading: "First records", paragraphs: ["Check the copper fittings."], checklist: [] },
        { heading: "Second records", paragraphs: ["Review the aquifer map."], checklist: [] },
      ],
      sources: [{ tag: "SOURCE", text: "The historic register", href: "https://example.com/source" }],
      relatedLinks: [{ label: "Read the parcel checklist", href: "/contact" }],
    });
    expect(getGuideFinderMatch(entry, "copper aquifer")).toEqual({ excerpt: "Check the copper fittings." });
    expect(getGuideFinderMatch(entry, "zinc copper")).toEqual({ excerpt: "Check the copper fittings." });
    expect(getGuideFinderMatch(entry, "historic register")).toEqual({ excerpt: "The historic register" });
    expect(getGuideFinderMatch(entry, "parcel checklist")).toEqual({ excerpt: "Read the parcel checklist" });
  });

  it("keeps readable Unicode and multiline source text around a match near the end of a long paragraph", () => {
    const paragraph = `${"Earlier records describe ordinary maintenance. ".repeat(20)}\nReview the cafe\u0301’s high—efficiency heat-pump records before proceeding.\n${"Keep the original documents available. ".repeat(6)}`;
    const { entry } = matchFixture({ sections: [{ heading: "Documentation", paragraphs: [paragraph], checklist: [] }] });
    const match = getGuideFinderMatch(entry, "CAFÉ high efficiency HEAT pump")!;
    expect(match.excerpt).toContain("cafe\u0301’s high—efficiency heat-pump");
    expect(match.excerpt).toContain("\n");
    expect(match.excerpt.startsWith("…")).toBe(true);
    expect(match.excerpt.endsWith("…")).toBe(true);
    expect(match.excerpt.length).toBeGreaterThanOrEqual(180);
    expect(match.excerpt.length).toBeLessThanOrEqual(220);
    expect(paragraph).toContain(match.excerpt.replace(/^…|…$/g, ""));
    expect(match.sectionHref).toBe(`${inspectionPath}#documentation`);
  });

  it("keeps distinct query terms together when a common term also appears much earlier", () => {
    const paragraph = `A property question comes first. ${"Review ordinary documents carefully. ".repeat(16)}Near the end, property-specific radon testing deserves a focused question and the original supporting records.`;
    const { entry } = matchFixture({ sections: [{ heading: "Documentation", paragraphs: [paragraph], checklist: [] }] });
    const match = getGuideFinderMatch(entry, "property radon")!;
    expect(match.excerpt).toContain("property-specific radon testing");
    expect(match.excerpt).not.toContain("A property question comes first.");
    expect(match.excerpt.length).toBeLessThanOrEqual(240);
    expect(paragraph).toContain(match.excerpt.replace(/^…|…$/g, ""));
    expect(getGuideFinderMatch(entry, "property radon")).toEqual(match);
  });

  it("keeps a fitting 200-character matching token whole inside a much longer unbroken word", () => {
    const token = "R".repeat(200);
    const paragraph = `${"🙂q".repeat(101)}${token}${"q🙂".repeat(101)}`;
    const { entry } = matchFixture({ sections: [{ heading: "Documentation", paragraphs: [paragraph], checklist: [] }] });
    const match = getGuideFinderMatch(entry, token.toLowerCase())!;
    expect(match.excerpt).toContain(token);
    expect(match.excerpt.length).toBeLessThanOrEqual(240);
    const literal = match.excerpt.replace(/^…|…$/g, "");
    expect(paragraph).toContain(literal);
    expect(Array.from(literal).every((character) => !/^[\uD800-\uDFFF]$/.test(character))).toBe(true);
    expect(match.sectionHref).toBe(`${inspectionPath}#documentation`);
  });

  it("uses current published passages and does not retain removed section headings or text", () => {
    const before = matchFixture({ sections: [{ heading: "Retired radon section", paragraphs: ["The retired wording."], checklist: [] }] });
    const after = matchFixture({ sections: [{ heading: "Owner copper notes", paragraphs: ["Owner-reviewed copper installations."], checklist: [] }] });
    expect(getGuideFinderMatch(before.entry, "radon")?.sectionHref).toBe(`${inspectionPath}#retired-radon-section`);
    expect(getGuideFinderMatch(after.entry, "radon")).toBeUndefined();
    expect(getGuideFinderMatch(after.entry, "copper")).toEqual({
      excerpt: "Owner copper notes",
      sectionHeading: "Owner copper notes",
      sectionHref: `${inspectionPath}#owner-copper-notes`,
    });
  });

  it("preserves published anchor rules and withholds jumps for duplicate section IDs", () => {
    expect(insightSectionId("A Buyer's Checklist!", 3)).toBe("a-buyer-s-checklist");
    expect(insightSectionId("東京", 2)).toBe("section-3");
    expect(insightSectionId("", 0)).toBe("section-1");
    const duplicate = matchFixture({ sections: [
      { heading: "Flood risk", paragraphs: ["Review the copper equipment."], checklist: [] },
      { heading: "Flood-risk", paragraphs: ["Review aquifer maps."], checklist: [] },
    ] });
    expect(getGuideFinderMatch(duplicate.entry, "aquifer")).toEqual({ excerpt: "Review aquifer maps." });
    const fallback = matchFixture({ sections: [{ heading: "東京", paragraphs: ["Review copper equipment."], checklist: [] }] });
    expect(getGuideFinderMatch(fallback.entry, "copper")?.sectionHref).toBe(`${inspectionPath}#section-1`);
  });

  it.each(["A".repeat(161), "Record 1234567890"])("keeps the excerpt without emitting a section ID rejected by URL privacy: %s", (heading) => {
    const { entry } = matchFixture({ sections: [{ heading, paragraphs: ["Review copper equipment."], checklist: [] }] });
    expect(insightSectionId(heading, 0)).toBe(heading.toLowerCase().replaceAll(" ", "-"));
    expect(getGuideFinderMatch(entry, "copper")).toEqual({ excerpt: "Review copper equipment." });
  });

  it.each([
    [`${inspectionPath}?from=directory&topic=heat%20pump#old-anchor`, `${inspectionPath}?from=directory&topic=heat%20pump#equipment-records`],
    [`${siteUrl}${inspectionPath}/?from=directory#old-anchor`, `${inspectionPath}/?from=directory#equipment-records`],
  ])("adds a root-relative section action without changing the original destination %s", (href, sectionHref) => {
    const { entry, card, article } = matchFixture({}, { href });
    const before = structuredClone({ entry, card, article });
    Object.freeze(entry);
    Object.freeze(card);
    expect(getGuideFinderMatch(entry, "COPPER copper")?.sectionHref).toBe(sectionHref);
    expect(findGuideFinderEntries([entry], "copper")[0]).toBe(entry);
    expect(entry.card).toBe(card);
    expect(entry.card.href).toBe(href);
    expect({ entry, card, article }).toEqual(before);
  });

  it("does not create section actions for external, unsafe, or missing article destinations", () => {
    const hrefs = [
      `https://elsewhere.example${inspectionPath}`,
      `https://reader@southjerseyreal.estate${inspectionPath}`,
      `//elsewhere.example${inspectionPath}`,
      "javascript:alert(1)",
      "/faq#buy",
      "/insights/not-an-accepted-article",
      "/insights/invalid\\destination",
    ];
    const cards = hrefs.map((href) => ({ ...inspectionCard, href, title: "Copper resources" }));
    const accepted = buildGuideFinderEntries(cards, documents);
    for (const entry of accepted) {
      expect(getGuideFinderMatch(entry, "copper")).toEqual({ excerpt: "Copper resources" });
      expect(getGuideFinderMatch(entry, "radon")).toBeUndefined();
    }
  });
});
