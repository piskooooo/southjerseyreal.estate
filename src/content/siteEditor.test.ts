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

    const missingAlt = structuredClone(managedContentSeeds.get("/")) as ManagedPageDocument;
    missingAlt.page.sections[0].images[0].alt = "";
    expect(() => validateManagedContentForPublish("/", missingAlt)).toThrow(/alt text/i);
  });
});
