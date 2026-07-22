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
      "/newsletter",
      "/faq",
      "/partners",
      "/advertise",
    ]));
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
