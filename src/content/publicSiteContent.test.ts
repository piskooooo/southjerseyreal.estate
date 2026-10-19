import { afterEach, describe, expect, it, vi } from "vitest";
import { countySiteContent } from "./countySiteContent";
import { buildGuideFinderEntries, findGuideFinderEntries } from "./guideFinder";
import { createManagedContentRuntime, SITEWIDE_CONTENT_KEY, type CountySiteContent } from "./managedContentRuntime";
import { countyNav } from "./navigation";
import { createPublicSiteContent, isKnownPublicPath, knownPublicPaths } from "./publicSiteContent";
import { seoEntries } from "./seo";
import { managedPageSeeds, seedPublicSiteContent as seedFullContent } from "./siteEditor";

const countyPaths = countyNav.map((county) => county.path);
const inspectionPath = "/insights/home-inspections-and-repair-questions";
const countyGate = () => {
  let resolve!: (value: CountySiteContent) => void;
  const promise = new Promise<CountySiteContent>((release) => { resolve = release; });
  return { promise, resolve };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public content preparation", () => {
  it("keeps all non-county seeds exact without exposing county placeholders or loading the county chunk", async () => {
    const loader = vi.fn(async () => countySiteContent);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    for (const path of ["/", "/insights", inspectionPath, "/faq", "/not-a-public-page", "/invented-county"]) {
      await client.preparePublicContent(path);
      expect(client.isPublicContentReady(path)).toBe(true);
    }
    expect(loader).not.toHaveBeenCalled();
    const seeded = client.seedPublicSiteContent();
    expect([...seeded.pages.values()]).toEqual(managedPageSeeds.filter((document) => !countyPaths.includes(document.page.path)));
    expect([...seeded.pages.values()].filter((document) => document.insightArticle)).toHaveLength(9);
    for (const path of countyPaths) {
      expect(seeded.pages.has(path)).toBe(false);
      expect(client.isPublicContentReady(path)).toBe(false);
      expect(isKnownPublicPath(`${path}/`)).toBe(true);
    }
    expect([...knownPublicPaths]).toEqual(seoEntries.map((entry) => entry.path));
    expect(isKnownPublicPath("/invented-county")).toBe(false);
  });

  it("shares one pending county import, then exposes the complete original seed set in its original order", async () => {
    const gate = countyGate();
    const loader = vi.fn(() => gate.promise);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    const first = client.preparePublicContent("/counties");
    const second = client.preparePublicContent("/camden-county/");
    expect(first).toBe(second);
    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(client.isPublicContentReady("/counties")).toBe(false);
    expect(client.seedPublicSiteContent().pages.has("/camden-county")).toBe(false);

    gate.resolve(countySiteContent);
    await first;
    expect(client.seedPublicSiteContent()).toEqual(seedFullContent());
    for (const path of ["/counties", ...countyPaths, "/", inspectionPath]) {
      await client.preparePublicContent(path);
      expect(client.isPublicContentReady(path)).toBe(true);
    }
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("allows a failed chunk to be retried without marking county content ready", async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error("Chunk request failed"))
      .mockResolvedValueOnce(countySiteContent);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    await expect(client.preparePublicContent("/counties")).rejects.toThrow("Chunk request failed");
    expect(client.isPublicContentReady("/counties")).toBe(false);
    expect(client.seedPublicSiteContent().pages.has("/camden-county")).toBe(false);
    await client.preparePublicContent("/camden-county");
    expect(client.seedPublicSiteContent()).toEqual(seedFullContent());
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("rejects incomplete county payloads rather than manufacturing missing county pages", async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce({ ...countySiteContent, pages: countySiteContent.pages.slice(0, 1) })
      .mockResolvedValueOnce(countySiteContent);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    await expect(client.preparePublicContent("/counties")).rejects.toThrow("could not be prepared");
    expect(client.isPublicContentReady("/counties")).toBe(false);
    expect(client.seedPublicSiteContent().pages.has("/atlantic-county")).toBe(false);
    await client.preparePublicContent("/counties");
    expect(client.seedPublicSiteContent()).toEqual(seedFullContent());
  });

  it("preserves independent base and full normalizer instances", () => {
    const base = createManagedContentRuntime();
    const full = createManagedContentRuntime(countySiteContent);
    expect(base.managedPageSeeds.some((document) => countyPaths.includes(document.page.path))).toBe(false);
    expect(full.managedPageSeeds).toEqual(managedPageSeeds);
    const published = structuredClone(full.managedPageSeedByPath.get(inspectionPath)!);
    published.insightArticle!.relatedLinks = [];
    published.insightArticle!.sections.reverse();
    expect(base.normalizeManagedContent(inspectionPath, published)).toEqual(published);
    expect(full.normalizeManagedContent(inspectionPath, published)).toEqual(published);
    expect(() => base.normalizeManagedContent("/camden-county", {})).toThrow("unknown page");
  });
});

describe("prepared public content loading", () => {
  const configure = () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
  };

  it("retains the Home request scope without loading county material", async () => {
    configure();
    const loader = vi.fn(async () => countySiteContent);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    const fetchContent = vi.fn(async (_url: string) => ({ ok: true, json: async () => [] }));
    vi.stubGlobal("fetch", fetchContent);
    const content = await client.loadPublishedSiteContent("/");
    expect(content).toEqual(client.seedPublicSiteContent());
    expect(loader).not.toHaveBeenCalled();
    expect(fetchContent).toHaveBeenCalledTimes(1);
    expect(new URL(fetchContent.mock.calls[0][0]).searchParams.get("page_key")).toBe(`in.(${SITEWIDE_CONTENT_KEY},/)`);
  });

  it("waits for county seeds, then merges all seven accepted county documents in one request", async () => {
    configure();
    const gate = countyGate();
    const client = createPublicSiteContent({ loadCountyContent: () => gate.promise });
    const published = structuredClone(seedFullContent().pages.get("/camden-county")!);
    const towns = published.page.sections.filter((section) => section.kind === "town");
    const removedId = towns.at(-1)!.id;
    towns[0].blocks[0].text = "Owner's Camden community heading";
    published.page.sections = published.page.sections.filter((section) => section.id !== removedId);
    const fetchContent = vi.fn(async (_url: string) => ({
      ok: true,
      json: async () => [{ page_key: published.page.path, published_content: published, published_at: "2026-10-19T12:00:00Z" }],
    }));
    vi.stubGlobal("fetch", fetchContent);
    const loading = client.loadPublishedSiteContent("/counties");
    await Promise.resolve();
    expect(fetchContent).not.toHaveBeenCalled();
    gate.resolve(countySiteContent);
    const content = await loading;
    expect(fetchContent).toHaveBeenCalledTimes(1);
    expect(new URL(fetchContent.mock.calls[0][0]).searchParams.get("page_key"))
      .toBe(`in.(${[SITEWIDE_CONTENT_KEY, "/counties", ...countyPaths].join(",")})`);
    expect(content.pages.get("/camden-county")!.page).toEqual(published.page);
    expect(countyPaths.every((path) => content.pages.has(path))).toBe(true);
  });

  it("keeps all nine accepted full articles searchable without a county import", async () => {
    configure();
    const loader = vi.fn(async () => countySiteContent);
    const client = createPublicSiteContent({ loadCountyContent: loader });
    const seeded = structuredClone(client.seedPublicSiteContent());
    const index = seeded.pages.get("/insights")!;
    const article = seeded.pages.get(inspectionPath)!;
    index.insightIndex!.articles = [index.insightIndex!.articles.find((card) => card.href === inspectionPath)!];
    article.insightArticle!.sections = [{ heading: "Owner's review notes", paragraphs: ["A published cobalt installation question."], checklist: [] }];
    const fetchContent = vi.fn(async (_url: string) => ({
      ok: true,
      json: async () => [index, article].map((document) => ({ page_key: document.page.path, published_content: document, published_at: "2026-10-19T12:00:00Z" })),
    }));
    vi.stubGlobal("fetch", fetchContent);
    const content = await client.loadPublishedSiteContent("/insights");
    const articlePaths = [...seeded.pages.values()].filter((document) => document.insightArticle).map((document) => document.page.path);
    expect(articlePaths).toHaveLength(9);
    expect(new URL(fetchContent.mock.calls[0][0]).searchParams.get("page_key"))
      .toBe(`in.(${[SITEWIDE_CONTENT_KEY, "/insights", ...articlePaths].join(",")})`);
    const entries = buildGuideFinderEntries(content.pages.get("/insights")!.insightIndex!.articles, content.pages.values());
    expect(findGuideFinderEntries(entries, "cobalt installation").map((entry) => entry.card.href)).toEqual([inspectionPath]);
    expect(findGuideFinderEntries(entries, "radon")).toEqual([]);
    expect(loader).not.toHaveBeenCalled();
  });

  it("retains prepared county fallbacks when the published request fails", async () => {
    configure();
    const client = createPublicSiteContent({ loadCountyContent: async () => countySiteContent });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Network unavailable"); }));
    expect(await client.loadPublishedSiteContent("/camden-county")).toEqual(seedFullContent());
  });
});
