import { describe, expect, it } from "vitest";
import { buildGuideFinderEntries, findGuideFinderEntries } from "./guideFinder";
import { insightArticles, insightIndex, type InsightArticleContent, type InsightCard } from "./insights";
import { siteUrl } from "./seo";

const documents = Object.entries(insightArticles).map(([path, insightArticle]) => ({ page: { path }, insightArticle }));
const entries = buildGuideFinderEntries(insightIndex.articles, documents);
const inspectionPath = "/insights/home-inspections-and-repair-questions";
const inspectionCard = insightIndex.articles.find((card) => card.href === inspectionPath)!;
const resultHrefs = (query: string) => findGuideFinderEntries(entries, query).map((entry) => entry.card.href);

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
  ])("finds %s inside the complete guide text", (query, expectedHref) => {
    expect(entries).toHaveLength(8);
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
