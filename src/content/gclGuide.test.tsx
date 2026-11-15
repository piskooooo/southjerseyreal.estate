// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InsightArticlePage } from "../components/Layouts";
import { insightArticles, insightIndex } from "./insights";
import { buildGuideFinderEntries, findGuideFinderEntries } from "./guideFinder";
import { renderInsights } from "./prerenderInsights";
import { managedContentSeeds, normalizeManagedContent, validateManagedContentForPublish, type ManagedPageDocument } from "./siteEditor";

const path = "/insights/glassboro-camden-line";
const mapId = "19dnfwAOP-Hf17G2_YofYS-AfnuotSmY";
const seed = (key: string) => structuredClone(managedContentSeeds.get(key)) as ManagedPageDocument;
beforeEach(() => vi.stubGlobal("matchMedia", vi.fn(() => ({
  matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
}))));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("GCL guide", () => {
  it("provides a sourced, editable article with every proposed station in initial HTML", () => {
    const value = seed(path);
    expect(value).toBeDefined();
    expect(() => validateManagedContentForPublish(path, value)).not.toThrow();
    const element = document.createElement("main");
    element.innerHTML = renderInsights(value);
    expect(Array.from(element.querySelectorAll(".insight-ordered-list li"), (item) => item.textContent)).toEqual([
      "Walter Rand Transportation Center", "Lanning Square", "South Camden", "Gloucester City",
      "Crown Point Road", "Red Bank Avenue", "Woodbury", "Woodbury Heights", "Mantua", "Sewell",
      "Mantua Pitman", "Pitman", "North Glassboro", "Glassboro",
    ]);
    expect(element.querySelector("iframe")).toBeNull();
    expect(element.querySelector('a[href*="/maps/d/viewer"]')).not.toBeNull();
    expect(element.textContent).toContain("proposed");
    const normalized = normalizeManagedContent(path, value) as ManagedPageDocument;
    expect(normalized).toEqual(value);
    const entries = buildGuideFinderEntries(insightIndex.articles, [value]);
    expect(findGuideFinderEntries(entries, "Lanning Square").map((entry) => entry.card.href)).toEqual([path]);
  });

  it("loads only the approved map after activation, keeps the fallback, and unloads it on request", () => {
    // Exercise the renderer with new section data before the new route exists.
    const article = structuredClone(insightArticles["/insights/new-jersey-homebuying-process"]);
    Object.assign(article.sections[0], { map: "gcl" });
    const { container } = render(<InsightArticlePage article={article} navigate={vi.fn()} />);
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Load interactive map" }));
    const frame = container.querySelector("iframe")!;
    expect(frame).not.toBeNull();
    expect(new URL(frame.src).searchParams.get("mid")).toBe(mapId);
    expect(frame.getAttribute("title")).toMatch(/proposed GCL/i);
    expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(screen.getByRole("link", { name: "Open in Google Maps" }).getAttribute("href")).toContain("/viewer?");
    fireEvent.click(screen.getByRole("button", { name: "Unload interactive map" }));
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Load interactive map" })).toBeTruthy();
  });

  it("does not render arbitrary map keys or turn them into iframe addresses", () => {
    const article = structuredClone(insightArticles["/insights/new-jersey-homebuying-process"]);
    Object.assign(article.sections[0], { map: "https://example.com/unapproved" });
    const { container } = render(<InsightArticlePage article={article} navigate={vi.fn()} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("button", { name: "Load interactive map" })).toBeNull();
  });

  it("adds only the GCL card to version-two indexes without restoring removed older cards", () => {
    const value = seed("/insights");
    value.insightIndexVersion = 2;
    value.insightIndex!.articles = [{ ...value.insightIndex!.articles[1], title: "Owner's selected guide" }];
    const original = structuredClone(value);
    const upgraded = normalizeManagedContent("/insights", value) as ManagedPageDocument;
    expect(upgraded.insightIndex!.articles.map((card) => card.href)).toEqual([
      original.insightIndex!.articles[0].href, path,
    ]);
    expect(upgraded.insightIndex!.articles[0]).toEqual(original.insightIndex!.articles[0]);
    expect(value).toEqual(original);
    upgraded.insightIndex!.articles.pop();
    expect(normalizeManagedContent("/insights", upgraded)).toEqual(upgraded);
  });

  it("preserves edited station lists, removed map blocks and removed sections through normalization", () => {
    const value = seed(path);
    expect(value).toBeDefined();
    const sections = value.insightArticle!.sections;
    const stations = sections.find((section) => "orderedList" in section)! as typeof sections[number] & { orderedList: string[] };
    stations.orderedList = ["Owner's reviewed station note"];
    value.insightArticle!.sections = sections.filter((section) => !("map" in section)).reverse();
    expect(normalizeManagedContent(path, value)).toEqual(value);
  });

  it("rejects an unsupported map before publication", () => {
    const value = seed(path);
    Object.assign(value.insightArticle!.sections[1], { map: "https://example.com/unapproved" });
    expect(() => validateManagedContentForPublish(path, value)).toThrow(/map/i);
  });

  it("updates the unchanged Maps privacy disclosure while preserving custom policy edits", () => {
    const value = seed("/privacy-policy");
    const legacy = "Google Maps Platform supplies public Google review content on the About page. When a visitor chooses to load those reviews, review data and reviewer profile images may be requested from Google. Google's handling of information is described in the Google Privacy Policy.";
    const block = value.page.sections[0].blocks.find((item) => item.text.startsWith("Google Maps Platform supplies"))!;
    block.text = legacy;
    value.page.sections[0].blocks.find((item) => item.text.startsWith("Last updated:"))!.text = "Last updated: July 19, 2026";
    const upgraded = normalizeManagedContent("/privacy-policy", value) as ManagedPageDocument;
    expect(upgraded.page.sections[0].blocks.find((item) => item.text.startsWith("Google Maps Platform supplies"))!.text).toContain("My Maps");
    expect(upgraded.page.sections[0].blocks.find((item) => item.text.startsWith("Last updated:"))!.text).toBe("Last updated: November 15, 2026");
    block.text = "Owner's reviewed Google disclosure.";
    expect(normalizeManagedContent("/privacy-policy", value)).toEqual(value);
  });
});
