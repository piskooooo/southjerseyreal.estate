import { describe, expect, it } from "vitest";
import {
  managedContentSeeds,
  normalizeManagedContent,
  SITEWIDE_CONTENT_KEY,
  validateManagedContentForPublish,
  type ManagedPageDocument,
  type SitewideContent,
} from "./siteEditor";

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
    olderIndex.insightIndex!.articles = olderIndex.insightIndex!.articles.slice(0, 2);

    const normalized = normalizeManagedContent("/insights", olderIndex) as ManagedPageDocument;
    expect(normalized.insightIndex?.articles).toHaveLength(8);
    expect(normalized.insightIndex?.articles.map((article) => article.href)).toContain(
      "/insights/coastal-property-due-diligence",
    );
  });

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
