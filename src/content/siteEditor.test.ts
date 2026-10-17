import { describe, expect, it } from "vitest";
import legacySummaries from "./legacyCommunitySummaries.json";
import { countyNav } from "./navigation";
import {
  managedContentSeeds,
  normalizeManagedContent,
  SITEWIDE_CONTENT_KEY,
  validateManagedContentForPublish,
  type ManagedPageDocument,
  type SitewideContent,
} from "./siteEditor";

describe("reviewed town introduction upgrades", () => {
  const legacyCounties = legacySummaries.counties as Record<string, Array<{
    id: string;
    summary: string;
    sources: Array<{ tag: string; text: string; href: string; accessed: string }>;
  }>>;

  it("upgrades all 166 unchanged published summaries and sources without changing historical details", () => {
    let upgraded = 0;
    for (const [path, entries] of Object.entries(legacyCounties)) {
      const seed = managedContentSeeds.get(path) as ManagedPageDocument;
      const legacy = structuredClone(seed);
      delete legacy.communitySummariesVersion;
      for (const entry of entries) {
        const town = legacy.page.sections.find((section) => section.id === entry.id)!;
        town.blocks[1].text = entry.summary;
        town.blocks = town.blocks.filter((block) => block.tag !== "SOURCE");
        town.blocks.push(...structuredClone(entry.sources));
      }
      const original = structuredClone(legacy);
      const normalized = normalizeManagedContent(path, legacy) as ManagedPageDocument;
      expect(legacy).toEqual(original);
      expect(normalized.communitySummariesVersion).toBe(1);
      for (const entry of entries) {
        const town = normalized.page.sections.find((section) => section.id === entry.id)!;
        const seedTown = seed.page.sections.find((section) => section.id === entry.id)!;
        const originalTown = original.page.sections.find((section) => section.id === entry.id)!;
        expect(town.blocks[1]).toEqual(seedTown.blocks[1]);
        expect(town.blocks[1].text).not.toBe(entry.summary);
        expect(town.blocks.slice(2).filter((block) => block.tag !== "SOURCE"))
          .toEqual(originalTown.blocks.slice(2).filter((block) => block.tag !== "SOURCE"));
        expect(town.blocks.filter((block) => block.tag === "SOURCE"))
          .toEqual(seedTown.blocks.filter((block) => block.tag === "SOURCE"));
        expect(town.images).toEqual(originalTown.images);
        upgraded++;
      }
      expect(normalizeManagedContent(path, structuredClone(normalized))).toEqual(normalized);
      expect(() => validateManagedContentForPublish(path, normalized)).not.toThrow();
    }
    expect(upgraded).toBe(166);
  });

  it("preserves custom summaries, source edits, card removals, and ordering during an older-version upgrade", () => {
    const path = "/camden-county";
    const draft = structuredClone(managedContentSeeds.get(path)) as ManagedPageDocument;
    draft.communitySummariesVersion = 0;
    const [first, second, removed] = legacyCounties[path];
    const firstTown = draft.page.sections.find((section) => section.id === first.id)!;
    firstTown.blocks[1].text = "The owner's introduction has its own local observations and wording.";
    const customFirst = structuredClone(firstTown);
    const secondTown = draft.page.sections.find((section) => section.id === second.id)!;
    secondTown.blocks[1].text = second.summary;
    const source = { ...second.sources[0], text: "Owner's source label", accessed: "2026-09-01" };
    secondTown.blocks = secondTown.blocks.filter((block) => block.tag !== "SOURCE");
    secondTown.blocks.push(source);
    const customDetail = { tag: "P", text: "Owner's additional expanded detail." };
    secondTown.blocks.push(customDetail);
    draft.page.sections = draft.page.sections.filter((section) => section.id !== removed.id).reverse();
    const normalized = normalizeManagedContent(path, draft) as ManagedPageDocument;
    expect(normalized.page.sections.map((section) => section.id)).toEqual(draft.page.sections.map((section) => section.id));
    expect(normalized.page.sections.find((section) => section.id === first.id)).toEqual(customFirst);
    const upgraded = normalized.page.sections.find((section) => section.id === second.id)!;
    expect(upgraded.blocks).toContainEqual(source);
    expect(upgraded.blocks).toContainEqual(customDetail);
    expect(upgraded.blocks[1].text).not.toBe(second.summary);
    const hrefs = upgraded.blocks.filter((block) => block.tag === "SOURCE").map((block) => block.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(normalized.page.sections.some((section) => section.id === removed.id)).toBe(false);
  });

  it("preserves intentional later reverts and edits in a versioned document", () => {
    const path = "/burlington-county";
    const draft = structuredClone(managedContentSeeds.get(path)) as ManagedPageDocument;
    draft.communitySummariesVersion = 1;
    const first = legacyCounties[path][0];
    const town = draft.page.sections.find((section) => section.id === first.id)!;
    town.blocks[1].text = first.summary;
    town.blocks = town.blocks.filter((block) => block.tag !== "SOURCE");
    const intro = draft.page.sections.find((section) => section.kind === "intro")!;
    const date = intro.blocks.find((block) => block.text.startsWith("Community profiles updated "))!;
    date.text = "Owner's preferred revision note.";
    expect(normalizeManagedContent(path, draft)).toEqual(draft);
  });
});

const selectedCountyGuides = {
  "/camden-county": [
    { tag: "A", text: "Preparing to sell a New Jersey home", href: "/insights/preparing-to-sell-a-new-jersey-home" },
    { tag: "A", text: "Researching municipal records, permits, and zoning", href: "/insights/municipal-records-permits-and-zoning" },
  ],
  "/atlantic-county": [
    { tag: "A", text: "Coastal property due diligence for a shore home", href: "/insights/coastal-property-due-diligence" },
  ],
} as const;

describe("selected county contextual guide links", () => {
  const guideHrefs = new Set<string>(Object.values(selectedCountyGuides).flat().map((link) => link.href));

  it("seeds the selected links only in Camden and Atlantic introductions", () => {
    for (const [pageKey, seed] of managedContentSeeds) {
      if (!pageKey.endsWith("-county")) continue;
      const document = seed as ManagedPageDocument;
      const expected = selectedCountyGuides[pageKey as keyof typeof selectedCountyGuides] || [];
      const intro = document.page.sections[0];
      expect(intro.blocks.filter((block) => guideHrefs.has(block.href || ""))).toEqual(expected);
      expect(document.page.sections.slice(1).flatMap((section) => section.blocks)
        .filter((block) => guideHrefs.has(block.href || ""))).toEqual([]);
      expect(document.countyGuideLinksVersion).toBe(expected.length ? 1 : undefined);
      expect(normalizeManagedContent(pageKey, structuredClone(document))).toEqual(document);
      expect(() => validateManagedContentForPublish(pageKey, document)).not.toThrow();
    }
  });

  it("upgrades raw missing and older versions once, appending only missing destinations", () => {
    for (const [pageKey, guides] of Object.entries(selectedCountyGuides)) {
      for (const previousVersion of [undefined, 0]) {
        const legacy = structuredClone(managedContentSeeds.get(pageKey)) as ManagedPageDocument;
        if (previousVersion === undefined) delete legacy.countyGuideLinksVersion;
        else legacy.countyGuideLinksVersion = previousVersion;
        const intro = legacy.page.sections[0];
        intro.blocks = intro.blocks.filter((block) => !guideHrefs.has(block.href || ""));
        intro.blocks.splice(1, 0, { tag: "P", text: "Owner-managed introduction retained as written." });
        if (previousVersion === 0) {
          intro.blocks.push({ ...guides[0], text: "Owner's existing guide label" });
        }
        const existingBlocks = structuredClone(intro.blocks);
        const existingHrefs = new Set(existingBlocks.filter((block) => block.tag === "A").map((block) => block.href));
        const normalized = normalizeManagedContent(pageKey, legacy) as ManagedPageDocument;
        expect(normalized.page.sections.find((section) => section.id === intro.id)?.blocks).toEqual([
          ...existingBlocks,
          ...guides.filter((guide) => !existingHrefs.has(guide.href)),
        ]);
        expect(normalized.page.sections.filter((section) => section.id !== intro.id))
          .toEqual(legacy.page.sections.filter((section) => section.id !== intro.id));
        expect(normalized.countyGuideLinksVersion).toBe(1);
        expect(normalizeManagedContent(pageKey, structuredClone(normalized))).toEqual(normalized);
        expect(() => validateManagedContentForPublish(pageKey, normalized)).not.toThrow();
      }
    }
  });

  it("preserves versioned owner copy, changed links, removals, and section order", () => {
    for (const pageKey of Object.keys(selectedCountyGuides)) {
      const draft = structuredClone(managedContentSeeds.get(pageKey)) as ManagedPageDocument;
      const intro = draft.page.sections[0];
      intro.blocks = [
        { tag: "P", text: "Owner's introduction remains in this position." },
        { tag: "A", text: "Owner's chosen research guide", href: "/insights/researching-a-south-jersey-property" },
        { tag: "H2", text: "Owner's county introduction" },
      ];
      draft.page.sections = [draft.page.sections[1], intro, ...draft.page.sections.slice(2).reverse()];
      draft.seo.title = "Owner's reviewed county title";
      draft.countyGuideLinksVersion = 1;
      const normalized = normalizeManagedContent(pageKey, draft) as ManagedPageDocument;
      expect(normalized).toEqual(draft);
      expect(normalized.page.sections.flatMap((section) => section.blocks)
        .filter((block) => guideHrefs.has(block.href || ""))).toEqual([]);
      expect(normalizeManagedContent(pageKey, structuredClone(normalized))).toEqual(normalized);
    }
  });

  it("does not recreate a removed introduction while upgrading an old document", () => {
    for (const pageKey of Object.keys(selectedCountyGuides)) {
      const legacy = structuredClone(managedContentSeeds.get(pageKey)) as ManagedPageDocument;
      const introId = legacy.page.sections[0].id;
      legacy.page.sections = legacy.page.sections.filter((section) => section.id !== introId);
      delete legacy.countyGuideLinksVersion;
      const normalized = normalizeManagedContent(pageKey, legacy) as ManagedPageDocument;
      expect(normalized.page.sections).toEqual(legacy.page.sections);
      expect(normalized.page.sections.some((section) => section.id === introId)).toBe(false);
      expect(normalized.page.sections.flatMap((section) => section.blocks)
        .filter((block) => guideHrefs.has(block.href || ""))).toEqual([]);
    }
  });
});

describe("website editor content normalization", () => {
  const selectedCountyPaths = [
    "/atlantic-county",
    "/burlington-county",
    "/camden-county",
    "/cape-may-county",
    "/cumberland-county",
  ];

  it("is idempotent for every compiled content document", () => {
    for (const [pageKey, seed] of managedContentSeeds) {
      expect(normalizeManagedContent(pageKey, structuredClone(seed))).toEqual(seed);
    }
  });

  it("preserves optional links in heterogeneous content-block arrays", () => {
    const seed = structuredClone(managedContentSeeds.get("/partners")) as ManagedPageDocument;
    const expectedLinks = seed.resourcePage?.panels
      .flatMap((panel) => panel.blocks)
      .filter((block) => block.tag === "A")
      .map((block) => block.href);
    const normalized = normalizeManagedContent("/partners", seed) as ManagedPageDocument;
    const actualLinks = normalized.resourcePage?.panels
      .flatMap((panel) => panel.blocks)
      .filter((block) => block.tag === "A")
      .map((block) => block.href);

    expect(actualLinks).toEqual(expectedLinks);
    expect(actualLinks?.every(Boolean)).toBe(true);
  });

  it("preserves dated source notes in content-block arrays", () => {
    const draft = structuredClone(managedContentSeeds.get("/gloucester-county")) as ManagedPageDocument;
    draft.page.sections[1].blocks.push({
      tag: "SOURCE",
      text: "New Jersey Municipalities",
      href: "https://www.nj.gov/infobank/revmuni.htm",
      accessed: "2026-07-18",
    });

    const normalized = normalizeManagedContent("/gloucester-county", draft) as ManagedPageDocument;
    expect(normalized.page.sections[1].blocks.at(-1)).toEqual({
      tag: "SOURCE",
      text: "New Jersey Municipalities",
      href: "https://www.nj.gov/infobank/revmuni.htm",
      accessed: "2026-07-18",
    });
  });

  it("does not expose duplicate legacy sections that public structured layouts ignore", () => {
    const home = managedContentSeeds.get("/") as ManagedPageDocument;
    expect(home.page.sections.map((section) => section.kind)).toEqual(["hero", "profile", "action"]);

    for (const pageKey of ["/why-new-jersey", "/why-south-jersey", "/faq", "/partners", "/advertise"]) {
      const document = managedContentSeeds.get(pageKey) as ManagedPageDocument;
      expect(document.page.sections.every((section) => section.kind === "action")).toBe(true);
    }
  });

  it("positions the homepage around Arthur's South Jersey buyer and seller guidance", () => {
    const home = managedContentSeeds.get("/") as ManagedPageDocument;
    const heroText = home.page.sections[0].blocks.map((block) => block.text);
    const actionBlocks = home.page.sections.find((section) => section.kind === "action")?.blocks || [];

    expect(home.seo).toMatchObject({
      title: "South Jersey Real Estate & REALTOR® Guidance | Arthur Pisko Jr.",
      description: "Explore South Jersey counties and get practical buyer and seller guidance from Arthur Pisko Jr., a South Jersey REALTOR® with local roots.",
    });
    expect(heroText).toContain(
      "Welcome to South Jersey Real Estate, a local guide to communities, real estate information, and practical buyer and seller resources across the region.",
    );
    expect(actionBlocks.map((block) => block.text)).toEqual([
      "Buying or selling in South Jersey?",
      "Arthur Pisko Jr., a South Jersey REALTOR® with local roots, helps residential buyers and sellers understand the process, organize property-specific questions, and plan their next steps.",
      "Read Buyer and Seller Guides",
      "Contact Arthur",
    ]);
    expect(actionBlocks.filter((block) => block.tag === "A").map((block) => block.href)).toEqual([
      "/insights",
      "/contact",
    ]);
  });

  it("adds one concise guidance section only to the five owner-selected county pages", () => {
    for (const pageKey of selectedCountyPaths) {
      const document = managedContentSeeds.get(pageKey) as ManagedPageDocument;
      const countyName = document.page.title.split(",")[0];
      const guidance = document.page.sections.find((section) => section.id === "county-buyer-seller-guidance");

      expect(guidance?.kind).toBe("support");
      expect(guidance?.blocks.map((block) => block.text)).toEqual([
        `Buying or selling in ${countyName}?`,
        "Use these community profiles as a starting point, then narrow the research to the property, municipality, and transaction questions that matter to you. Arthur Pisko Jr., a South Jersey REALTOR®, helps New Jersey buyers and sellers plan their next steps.",
        "Read Buyer and Seller Guides",
        "Contact Arthur",
      ]);
      expect(guidance?.blocks.filter((block) => block.tag === "A").map((block) => block.href)).toEqual([
        "/insights",
        "/contact",
      ]);
      expect(document.page.sections.indexOf(guidance!)).toBe(1);
    }

    for (const pageKey of ["/gloucester-county", "/salem-county"]) {
      const document = managedContentSeeds.get(pageKey) as ManagedPageDocument;
      expect(document.page.sections.some((section) => section.id === "county-buyer-seller-guidance")).toBe(false);
    }
  });

  it("upgrades exact legacy SEO copy and missing guidance without overwriting owner customizations", () => {
    const legacyHome = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    legacyHome.seo.title = "South Jersey Real Estate | Counties, Towns & Local Information";
    legacyHome.seo.description = "Explore South Jersey real estate and local information across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.";
    legacyHome.page.sections[0].blocks[1].text = "Welcome to South Jersey Real Estate, a hub for real estate and local information throughout South Jersey. Use the county menu to explore each part of the region.";
    legacyHome.page.sections.find((section) => section.kind === "action")!.blocks = [
      { tag: "H2", text: "Have a real estate question?" },
      { tag: "P", text: "Get in touch about a property, a move, or the market." },
      { tag: "A", text: "Contact", href: "/contact" },
    ];

    const normalizedHome = normalizeManagedContent("/", legacyHome) as ManagedPageDocument;
    expect(normalizedHome.seo.title).toBe("South Jersey Real Estate & REALTOR® Guidance | Arthur Pisko Jr.");
    expect(normalizedHome.page.sections[0].blocks[1].text).toContain("Welcome to South Jersey Real Estate");
    expect(normalizedHome.page.sections.find((section) => section.kind === "action")?.blocks).toHaveLength(4);

    const customHome = structuredClone(legacyHome);
    customHome.seo.title = "Owner-customized homepage title";
    customHome.seo.description = "Owner-customized homepage description.";
    customHome.page.sections[0].blocks[1].text = "Owner-customized homepage introduction.";
    const normalizedCustomHome = normalizeManagedContent("/", customHome) as ManagedPageDocument;
    expect(normalizedCustomHome.seo.title).toBe("Owner-customized homepage title");
    expect(normalizedCustomHome.seo.description).toBe("Owner-customized homepage description.");
    expect(normalizedCustomHome.page.sections[0].blocks[1].text).toBe("Owner-customized homepage introduction.");

    const legacyCounty = structuredClone(managedContentSeeds.get("/atlantic-county")) as ManagedPageDocument;
    legacyCounty.seo.description = "Explore shore communities, inland municipalities, and places across the mainland in Atlantic County, New Jersey.";
    legacyCounty.page.sections = legacyCounty.page.sections.filter(
      (section) => section.id !== "county-buyer-seller-guidance",
    );
    const normalizedCounty = normalizeManagedContent("/atlantic-county", legacyCounty) as ManagedPageDocument;
    expect(normalizedCounty.seo.description).toContain("guidance from REALTOR® Arthur Pisko Jr.");
    expect(normalizedCounty.page.sections[1].id).toBe("county-buyer-seller-guidance");

    const customCounty = structuredClone(legacyCounty);
    customCounty.seo.description = "Owner-customized Atlantic County description.";
    const normalizedCustom = normalizeManagedContent("/atlantic-county", customCounty) as ManagedPageDocument;
    expect(normalizedCustom.seo.description).toBe("Owner-customized Atlantic County description.");
  });

  it("upgrades only unchanged county hub descriptions while preserving owner card changes", () => {
    const seed = managedContentSeeds.get("/counties") as ManagedPageDocument;
    const legacy = structuredClone(seed);
    const cards = countyNav.map((county) => {
      const card = legacy.page.sections.find((section) => (
        section.blocks.some((block) => block.tag === "A" && block.href === county.path)
      ))!;
      card.blocks.find((block) => block.tag === "P")!.text =
        `Explore towns, cities, and local real estate information across ${county.label} County.`;
      return card;
    });
    cards[0].blocks.find((block) => block.tag === "H2")!.text = "Owner's Atlantic heading";
    cards[0].images[0].alt = "Owner's map description.";
    cards[0].blocks.reverse();
    cards[1].blocks.find((block) => block.tag === "P")!.text = "Owner's Burlington description.";
    cards[3].blocks.find((block) => block.tag === "A")!.href = "/contact";
    cards[4].id = "owner-custom-county-card";
    cards[5].blocks = cards[5].blocks.filter((block) => block.tag !== "P");
    legacy.page.sections = legacy.page.sections.filter((section) => section !== cards[2]).reverse();
    const original = structuredClone(legacy);
    const expected = structuredClone(legacy);
    for (const id of [cards[0].id, cards[6].id]) {
      const seedCard = seed.page.sections.find((section) => section.id === id)!;
      expected.page.sections.find((section) => section.id === id)!
        .blocks.find((block) => block.tag === "P")!.text =
        seedCard.blocks.find((block) => block.tag === "P")!.text;
    }

    const normalized = normalizeManagedContent("/counties", legacy) as ManagedPageDocument;
    expect(normalized).toEqual(expected);
    expect(legacy).toEqual(original);
    expect(normalizeManagedContent("/counties", normalized)).toEqual(normalized);
  });

  it("keeps both navigation hubs editable with their complete destination sets", () => {
    const counties = managedContentSeeds.get("/counties") as ManagedPageDocument;
    const connect = managedContentSeeds.get("/connect") as ManagedPageDocument;
    const countyLinks = counties.page.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.tag === "A")
      .map((block) => block.href);
    const connectLinks = connect.page.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.tag === "A")
      .map((block) => block.href);

    expect(countyLinks).toEqual([
      "/atlantic-county",
      "/burlington-county",
      "/camden-county",
      "/cape-may-county",
      "/cumberland-county",
      "/gloucester-county",
      "/salem-county",
      "/contact",
    ]);
    expect(connectLinks).toEqual(expect.arrayContaining([
      "/about",
      "/contact",
      "/insights",
      "/newsletter",
      "/faq",
      "/partners",
      "/advertise",
    ]));
  });

  it("keeps the Insights hub and sourced articles editable", () => {
    const hub = managedContentSeeds.get("/insights") as ManagedPageDocument;
    const article = managedContentSeeds.get(
      "/insights/new-jersey-homebuying-process",
    ) as ManagedPageDocument;

    expect(hub.insightIndex?.articles).toHaveLength(8);
    expect(article.insightArticle?.sections.length).toBeGreaterThanOrEqual(5);
    expect(article.insightArticle?.author).toBe("Arthur Pisko Jr.");
    expect(article.insightArticle?.sources.every((source) => source.tag === "SOURCE")).toBe(true);
    expect(() => validateManagedContentForPublish(
      "/insights/new-jersey-homebuying-process",
      structuredClone(article),
    )).not.toThrow();

    const stale = structuredClone(article);
    stale.insightArticle!.reviewedDate = "July 25, 2026";
    expect(() => validateManagedContentForPublish(
      "/insights/new-jersey-homebuying-process",
      stale,
    )).toThrow(/YYYY-MM-DD/i);
  });

  it("keeps the approved guide library visible when an older published index is loaded", () => {
    const olderIndex = structuredClone(managedContentSeeds.get("/insights")) as ManagedPageDocument;
    delete olderIndex.insightIndexVersion;
    olderIndex.insightIndex!.articles = olderIndex.insightIndex!.articles.slice(0, 2);
    olderIndex.insightIndex!.articles.reverse();
    olderIndex.insightIndex!.articles[0].title = "Owner's guide title";

    const normalized = normalizeManagedContent("/insights", olderIndex) as ManagedPageDocument;
    expect(normalized.insightIndex?.articles).toHaveLength(8);
    expect(normalized.insightIndex?.articles.map((article) => article.href)).toContain(
      "/insights/coastal-property-due-diligence",
    );
    expect(normalized.insightIndex?.articles[0].title).toBe("Owner's guide title");
  });

  it("adds contact links once to the six research guides while preserving owner reading links and later removals", () => {
    const paths = [
      "/insights/researching-a-south-jersey-property",
      "/insights/home-inspections-and-repair-questions",
      "/insights/municipal-records-permits-and-zoning",
      "/insights/questions-before-choosing-a-community",
      "/insights/coastal-property-due-diligence",
      "/insights/wells-septic-acreage-and-environmental-constraints",
    ];
    expect([...managedContentSeeds]
      .filter(([, value]) => (value as ManagedPageDocument).insightContactLinksVersion !== undefined)
      .map(([path]) => path).sort()).toEqual([...paths].sort());

    for (const path of paths) {
      const seed = managedContentSeeds.get(path) as ManagedPageDocument;
      const contactLink = seed.insightArticle!.relatedLinks.find((link) => link.href === "/contact")!;
      const legacy = structuredClone(seed);
      delete legacy.insightContactLinksVersion;
      legacy.insightArticle!.relatedLinks = legacy.insightArticle!.relatedLinks
        .filter((link) => link.href !== "/contact").reverse();
      legacy.insightArticle!.relatedLinks[0].label = "Owner's reading recommendation";
      const original = structuredClone(legacy);
      const expected = structuredClone(legacy);
      expected.insightContactLinksVersion = 1;
      expected.insightArticle!.relatedLinks.push(structuredClone(contactLink));

      const normalized = normalizeManagedContent(path, legacy) as ManagedPageDocument;
      expect(normalized).toEqual(expected);
      expect(legacy).toEqual(original);
      expect(normalizeManagedContent(path, normalized)).toEqual(normalized);

      for (const href of ["/contact", "/contact#property-question", "/contact/?topic=home-search"]) {
        const custom = structuredClone(legacy);
        custom.insightContactLinksVersion = 0;
        custom.insightArticle!.relatedLinks.splice(1, 0, { label: "Owner's contact invitation", href });
        const preserved = normalizeManagedContent(path, custom) as ManagedPageDocument;
        expect(preserved.insightArticle!.relatedLinks).toEqual(custom.insightArticle!.relatedLinks);
        expect(preserved.insightContactLinksVersion).toBe(1);
      }

      normalized.insightArticle!.relatedLinks.reverse();
      normalized.insightArticle!.relatedLinks = normalized.insightArticle!.relatedLinks
        .filter((link) => link.href !== "/contact");
      expect(normalizeManagedContent(path, normalized)).toEqual(normalized);
      normalized.insightArticle!.relatedLinks = [];
      expect(normalizeManagedContent(path, normalized)).toEqual(normalized);
    }
  });

  it("preserves intentional guide order, removals, and additions after legacy migration", () => {
    const legacy = structuredClone(managedContentSeeds.get("/insights")) as ManagedPageDocument;
    delete legacy.insightIndexVersion;
    legacy.insightIndex!.articles = legacy.insightIndex!.articles.slice(0, 3);
    const editable = normalizeManagedContent("/insights", legacy) as ManagedPageDocument;
    editable.insightIndex!.articles.reverse();
    editable.insightIndex!.articles.pop();
    editable.insightIndex!.articles.push({
      title: "Additional property research",
      href: "/contact",
      category: "Next steps",
      summary: "Contact Arthur about a property question.",
      reviewedDate: "2026-09-04",
    });

    const saved = normalizeManagedContent("/insights", editable) as ManagedPageDocument;
    const reloaded = normalizeManagedContent("/insights", JSON.parse(JSON.stringify(saved))) as ManagedPageDocument;
    expect(reloaded.insightIndex?.articles).toEqual(editable.insightIndex?.articles);

    editable.insightIndex!.articles = [];
    expect((normalizeManagedContent("/insights", editable) as ManagedPageDocument).insightIndex?.articles).toEqual([]);
  });

  it("does not let stored document content change the page identity", () => {
    const draft = structuredClone(managedContentSeeds.get("/about")) as ManagedPageDocument;
    draft.page.path = "/contact";
    expect((normalizeManagedContent("/about", draft) as ManagedPageDocument).page.path).toBe("/about");
  });

  it.each(["", "   ", "javascript:alert(1)", "//example.com", "/\\example.com"])(
    "rejects the invalid navigation destination %j before publishing",
    (path) => {
      const draft = structuredClone(managedContentSeeds.get(SITEWIDE_CONTENT_KEY)) as SitewideContent;
      draft.header.countyLinks.push({ label: "New destination", path });
      expect(() => validateManagedContentForPublish(SITEWIDE_CONTENT_KEY, draft)).toThrow(/destination|allowed/i);
    },
  );

  it("preserves valid edited header and footer destinations", () => {
    const draft = structuredClone(managedContentSeeds.get(SITEWIDE_CONTENT_KEY)) as SitewideContent;
    draft.header.countyLinks.push({ label: "Guides", path: "/insights" });
    draft.footer.linkGroups[0].links.push({ label: "Official resources", path: "https://www.nj.gov/" });
    expect(() => validateManagedContentForPublish(SITEWIDE_CONTENT_KEY, draft)).not.toThrow();
    expect(normalizeManagedContent(SITEWIDE_CONTENT_KEY, draft)).toEqual(draft);
  });

  it.each(["countiesPath", "connectPath", "followupPath"])(
    "requires the directly routed %s destination to remain on this site",
    (key) => {
      const pageKey = key === "followupPath" ? "/newsletter" : SITEWIDE_CONTENT_KEY;
      const draft = structuredClone(managedContentSeeds.get(pageKey))!;
      const fields = key === "followupPath"
        ? (draft as ManagedPageDocument).newsletter!
        : (draft as SitewideContent).header;
      for (const destination of ["", "https://example.com/", "//example.com", "/\\example.com", "/about\n"]) {
        Object.assign(fields, { [key]: destination });
        expect(() => validateManagedContentForPublish(pageKey, draft)).toThrow(/internal path|destination/i);
      }
      Object.assign(fields, { [key]: "/contact?topic=property#page" });
      expect(() => validateManagedContentForPublish(pageKey, draft)).not.toThrow();
    },
  );

  it("adds the fixed hub paths when normalizing older sitewide content", () => {
    const legacy = structuredClone(managedContentSeeds.get(SITEWIDE_CONTENT_KEY)) as SitewideContent;
    const legacyHeader = legacy.header as Partial<SitewideContent["header"]>;
    delete legacyHeader.countiesPath;
    delete legacyHeader.connectPath;

    const normalized = normalizeManagedContent(SITEWIDE_CONTENT_KEY, legacy) as SitewideContent;
    expect(normalized.header.countiesPath).toBe("/counties");
    expect(normalized.header.connectPath).toBe("/connect");
  });

  it("adds the optional support link when normalizing older sitewide content", () => {
    const legacy = structuredClone(managedContentSeeds.get(SITEWIDE_CONTENT_KEY)) as SitewideContent;
    const legacyFooter = legacy.footer as Partial<SitewideContent["footer"]>;
    delete legacyFooter.supportLabel;
    delete legacyFooter.supportHref;
    delete legacyFooter.supportNote;

    const normalized = normalizeManagedContent(SITEWIDE_CONTENT_KEY, legacy) as SitewideContent;
    expect(normalized.footer.supportLabel).toBe("Support SJRE");
    expect(normalized.footer.supportHref).toBe(
      "https://ko-fi.com/southjerseyrealestate?utm_source=southjerseyreal.estate&utm_medium=website&utm_campaign=sjre_support",
    );
    expect(normalized.footer.supportNote).toBe("Optional support. The newsletter remains free.");
  });

  it("updates the retired About portrait description in stored content", () => {
    const legacy = structuredClone(managedContentSeeds.get("/about")) as ManagedPageDocument;
    legacy.page.sections[0].images[0].alt = "Portrait of Arthur Pisko Jr. wearing glasses, a black shirt, and a plaid tie against a plain background.";

    const normalized = normalizeManagedContent("/about", legacy) as ManagedPageDocument;

    expect(normalized.page.sections[0].images[0].alt).toBe(
      "Portrait of Arthur Pisko Jr. wearing glasses and a black suit jacket.",
    );
  });

  it("migrates legacy county photos to curated credited images without replacing editor uploads", () => {
    const legacy = structuredClone(managedContentSeeds.get("/atlantic-county")) as ManagedPageDocument;
    const abseconSection = legacy.page.sections.find((section) => (
      section.images[0]?.src === "/assets/community/atlantic-absecon.webp"
    ));
    expect(abseconSection).toBeDefined();
    const legacyImage = abseconSection!.images[0];
    legacyImage.src = "/assets/live/absecon-webp.webp";
    legacyImage.alt = "Legacy image.";
    legacyImage.thumbnail = legacyImage.src;
    legacyImage.storagePath = "";
    delete legacyImage.credit;
    delete legacyImage.sourceUrl;
    delete legacyImage.license;
    delete legacyImage.licenseUrl;

    const migrated = normalizeManagedContent("/atlantic-county", legacy) as ManagedPageDocument;
    const migratedAbsecon = migrated.page.sections.find((section) => section.id === abseconSection!.id);
    expect(migratedAbsecon?.images[0]).toMatchObject({
      src: "/assets/community/atlantic-absecon.webp",
      credit: "LaetusStudiis",
      license: "CC BY-SA 4.0",
    });

    const uploaded = structuredClone(legacy);
    const uploadedAbsecon = uploaded.page.sections.find((section) => section.id === abseconSection!.id);
    uploadedAbsecon!.images[0] = {
      src: "https://example.supabase.co/storage/v1/object/public/site-images/absecon.webp",
      alt: "Owner-uploaded Absecon photograph.",
      storagePath: "community/absecon.webp",
      thumbnail: "https://example.supabase.co/storage/v1/object/public/site-images/absecon-thumb.webp",
      thumbnailPath: "community/absecon-thumb.webp",
    };
    const preserved = normalizeManagedContent("/atlantic-county", uploaded) as ManagedPageDocument;
    const preservedAbsecon = preserved.page.sections.find((section) => section.id === abseconSection!.id);
    expect(preservedAbsecon?.images[0].storagePath).toBe("community/absecon.webp");
    expect(preservedAbsecon?.images[0].src).toContain("example.supabase.co");
  });

  it("rejects unsafe links and missing image descriptions before publish", () => {
    const unsafe = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    const actionLink = unsafe.page.sections
      .flatMap((section) => section.blocks)
      .find((block) => block.tag === "A");
    expect(actionLink).toBeDefined();
    actionLink!.href = "javascript:alert(1)";
    expect(() => validateManagedContentForPublish("/", unsafe)).toThrow(/allowed/i);

    const unsafeFooter = structuredClone(
      managedContentSeeds.get(SITEWIDE_CONTENT_KEY),
    ) as SitewideContent;
    unsafeFooter.footer.creatorHref = "javascript:alert(1)";
    expect(() => validateManagedContentForPublish(SITEWIDE_CONTENT_KEY, unsafeFooter)).toThrow(/allowed/i);

    const unsafeSupport = structuredClone(
      managedContentSeeds.get(SITEWIDE_CONTENT_KEY),
    ) as SitewideContent;
    unsafeSupport.footer.supportHref = "javascript:alert(1)";
    expect(() => validateManagedContentForPublish(SITEWIDE_CONTENT_KEY, unsafeSupport)).toThrow(/allowed/i);

    const missingAlt = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    missingAlt.page.sections[0].images[0].alt = "";
    expect(() => validateManagedContentForPublish("/", missingAlt)).toThrow(/alt text/i);
  });

  it("requires complete HTTPS source notes and keeps volatile community facts beside a source", () => {
    const sourced = structuredClone(managedContentSeeds.get("/gloucester-county")) as ManagedPageDocument;
    sourced.page.sections[1].blocks[1].text = "The municipality reports that preserved land covers 25% of this example area.";
    sourced.page.sections[1].blocks.push({
      tag: "SOURCE",
      text: "Official municipal open-space plan",
      href: "https://example.nj.gov/open-space",
      accessed: "2026-07-18",
    });
    expect(() => validateManagedContentForPublish("/gloucester-county", sourced)).not.toThrow();

    const unsourced = structuredClone(sourced);
    unsourced.page.sections[1].blocks = unsourced.page.sections[1].blocks
      .filter((block) => block.tag !== "SOURCE");
    expect(() => validateManagedContentForPublish("/gloucester-county", unsourced)).toThrow(/dated authoritative source/i);

    const insecure = structuredClone(sourced);
    insecure.page.sections[1].blocks.at(-1)!.href = "http://example.nj.gov/open-space";
    expect(() => validateManagedContentForPublish("/gloucester-county", insecure)).toThrow(/credential-free HTTPS link/i);

    const invalidDate = structuredClone(sourced);
    invalidDate.page.sections[1].blocks.at(-1)!.accessed = "2026-02-30";
    expect(() => validateManagedContentForPublish("/gloucester-county", invalidDate)).toThrow(/valid accessed date/i);
  });
});
