// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { insightArticles, type InsightArticleContent, type InsightIndexContent } from "./insights";
import { renderInsights } from "./prerenderInsights";
import {
  normalizeManagedContent,
  seedPublicSiteContent,
  validateManagedContentForPublish,
  type ManagedPageDocument,
} from "./siteEditor";

const seeded = seedPublicSiteContent();
const seed = (path: string) => structuredClone(seeded.pages.get(path)!);
const texts = (elements: Iterable<Element>) => Array.from(elements, (element) => element.textContent);
const links = (elements: Iterable<Element>) => Array.from(elements, (element) => ({
  label: element.textContent,
  href: element.getAttribute("href"),
}));
const parse = (value: ManagedPageDocument) => {
  const element = document.createElement("main");
  element.innerHTML = renderInsights(value);
  return element;
};
const accepted = (value: ManagedPageDocument) => {
  const normalized = normalizeManagedContent(value.page.path, value) as ManagedPageDocument;
  validateManagedContentForPublish(value.page.path, normalized);
  return normalized;
};

function expectIndex(element: HTMLElement, index: InsightIndexContent) {
  expect(texts(element.querySelectorAll("h1"))).toEqual([index.title]);
  expect(element.querySelector(".insights-index-hero > .section-eyebrow")?.textContent).toBe(index.eyebrow);
  expect(element.querySelector(".insights-index-hero > p:last-child")?.textContent).toBe(index.introduction);
  expect(Array.from(element.querySelectorAll(".insight-card"), (card) => ({
    title: card.querySelector("h2 a")?.textContent,
    href: card.querySelector("h2 a")?.getAttribute("href"),
    category: card.querySelector(".insight-category")?.textContent,
    summary: card.querySelector("h2 + p")?.textContent,
    reviewedDate: card.querySelector("time")?.getAttribute("datetime"),
    readHref: card.querySelector(".insight-read-link")?.getAttribute("href"),
  }))).toEqual(index.articles.map((card) => ({ ...card, readHref: card.href })));
}

function expectArticle(element: HTMLElement, article: InsightArticleContent) {
  expect(texts(element.querySelectorAll("h1"))).toEqual([article.title]);
  expect(element.querySelector(".insight-article-hero > .section-eyebrow")?.textContent).toBe(article.eyebrow);
  expect(element.querySelector(".insight-article-summary")?.textContent).toBe(article.summary);
  expect(element.querySelector(".insight-article-notice")?.textContent).toBe(article.notice);
  expect(texts(element.querySelectorAll(".insight-article-meta > span")).slice(0, 3))
    .toEqual([`By ${article.author}`, article.category, article.readingTime]);
  expect(element.querySelector(".insight-article-meta time")?.getAttribute("datetime")).toBe(article.reviewedDate);
  expect(element.querySelector(".insight-back-link")?.getAttribute("href")).toBe("/insights");

  const sections = Array.from(element.querySelectorAll<HTMLElement>(".insight-article-body > section:not(.insight-sources)"));
  expect(sections.map((section) => ({
    heading: section.querySelector(":scope > h2")?.textContent,
    paragraphs: texts(section.querySelectorAll(":scope > p:not(.insight-section-number)")),
    checklist: texts(section.querySelectorAll(".insight-checklist li")),
  }))).toEqual(article.sections);
  expect(new Set(sections.map((section) => section.id)).size).toBe(sections.length);
  for (const selector of [".insight-contents-desktop a", ".insight-contents-dropdown a"]) {
    expect(links(element.querySelectorAll(selector))).toEqual(article.sections.map((section, index) => ({
      label: section.heading,
      href: `#${sections[index].id}`,
    })));
  }

  const sources = Array.from(element.querySelectorAll(".insight-sources .content-source-note"));
  expect(sources.map((source) => ({
    text: source.querySelector("a")?.textContent,
    href: source.querySelector("a")?.getAttribute("href"),
    accessed: source.querySelector("span")?.textContent,
  }))).toEqual(article.sources.map((source) => ({
    text: source.text,
    href: new URL(source.href!).href,
    accessed: `Accessed ${source.accessed}.`,
  })));
  expect(Array.from(element.querySelectorAll(".insight-sources > p time"), (time) => time.getAttribute("datetime")))
    .toEqual([article.publishedDate, article.reviewedDate]);
  expect(links(element.querySelectorAll(".insight-related-links a"))).toEqual(article.relatedLinks);
}

describe("Insights prerender", () => {
  it("renders the complete eight-guide directory with its accepted card content", () => {
    const value = seed("/insights");
    expect(value.insightIndex!.articles).toHaveLength(8);
    expectIndex(parse(value), value.insightIndex!);
  });

  it.each(Object.keys(insightArticles))("renders every section, checklist, source and next step for %s", (path) => {
    const value = seed(path);
    const element = parse(value);
    expectArticle(element, value.insightArticle!);
    if (path === "/insights/new-jersey-homebuying-process") {
      expect(element.querySelector(".insight-article-body > section")?.id).toBe("start-with-the-whole-housing-budget");
    }
  });

  it("preserves current published directory edits, ordering and intentional removals", () => {
    const value = seed("/insights");
    const original = structuredClone(value.insightIndex!);
    value.insightIndex!.title = "Owner's reviewed research library";
    value.insightIndex!.introduction = "A published introduction selected for this research library.";
    value.insightIndex!.articles = [original.articles[5], original.articles[1]];
    Object.assign(value.insightIndex!.articles[0], {
      title: "Owner's community research guide",
      summary: "A published card summary that replaces the compiled text.",
      category: "Owner's research",
      reviewedDate: "2026-10-18",
    });
    const published = accepted(value);
    const before = structuredClone(published);
    const element = parse(published);

    expectIndex(element, value.insightIndex!);
    expect(element.textContent).not.toContain(original.articles[0].title);
    expect(published).toEqual(before);
  });

  it("preserves accepted article edits and removed sections, paragraphs, checklist items, sources and links", () => {
    const value = seed("/insights/researching-a-south-jersey-property");
    const original = structuredClone(value.insightArticle!);
    const article = value.insightArticle!;
    Object.assign(article, {
      title: "Owner's reviewed property research",
      summary: "The accepted published summary replaces the compiled article summary.",
      notice: "The owner's published educational notice remains part of the complete article.",
      publishedDate: "2026-10-18",
      reviewedDate: "2026-10-19",
    });
    article.sections = [structuredClone(original.sections[2]), structuredClone(original.sections[0])];
    article.sections[0].heading = "Owner's first research step";
    article.sections[0].paragraphs = ["Published opening paragraph.", "Published final paragraph."];
    article.sections[0].checklist = ["Owner's first checklist item.", "Owner's final checklist item."];
    article.sections[1].paragraphs = article.sections[1].paragraphs.slice(0, 1);
    article.sections[1].checklist = [];
    article.sources = [structuredClone(original.sources[1]), structuredClone(original.sources[0])];
    article.sources[0] = {
      tag: "SOURCE",
      text: "Owner's reviewed public source",
      href: "https://EXAMPLE.gov/records?version=2&format=html",
      accessed: "2026-10-18",
    };
    article.relatedLinks = [{ href: "/camden-county", label: "Owner's selected next step" }];
    const published = accepted(value);
    const before = structuredClone(published);
    const element = parse(published);

    expectArticle(element, article);
    expect(element.querySelector(".insight-sources > p")?.textContent)
      .toBe("Published October 18, 2026. Last reviewed October 19, 2026.");
    expect(element.textContent).not.toContain(original.sections[1].heading);
    expect(element.textContent).not.toContain(original.sections[0].paragraphs[1]);
    expect(element.querySelector('.insight-related-links a[href="/contact"]')).toBeNull();
    expect(published).toEqual(before);
  });

  it("escapes directory text and quoted link attributes", () => {
    const value = seed("/insights");
    const payload = '<img src="x" onerror="bad()"> & <script>bad()</script>';
    const index = value.insightIndex!;
    index.title = payload;
    index.introduction = payload;
    index.articles = [{
      category: payload,
      title: payload,
      summary: payload,
      href: '/insights/example?q=" onclick="bad()',
      reviewedDate: '2026-10-18" onfocus="bad()',
    }];
    const element = parse(value);

    expectIndex(element, index);
    expect(element.querySelectorAll("script, img, [onclick], [onerror], [onfocus]")).toHaveLength(0);
  });

  it("escapes article text, source dates and quoted attributes while retaining fallback section anchors", () => {
    const value = seed("/insights/new-jersey-homebuying-process");
    const payload = '<svg onload="bad()"> & <script>bad()</script>';
    const article = value.insightArticle!;
    Object.assign(article, {
      title: payload,
      summary: payload,
      notice: payload,
      author: payload,
      category: payload,
      readingTime: payload,
      publishedDate: '2026-10-18" onfocus="bad()',
      reviewedDate: '2026-10-19" onmouseover="bad()',
    });
    article.sections = [{ heading: payload, paragraphs: [payload], checklist: [payload] }, {
      heading: "???",
      paragraphs: ["A section with a punctuation-only heading."],
      checklist: [],
    }];
    article.sources = [{
      tag: "SOURCE",
      text: payload,
      href: 'https://example.gov/?q=" onclick="bad()',
      accessed: '<img src="x" onerror="bad()">',
    }];
    article.relatedLinks = [{ href: '/contact?q=" onclick="bad()', label: payload }];
    const element = parse(value);

    expectArticle(element, article);
    expect(element.querySelector("#section-2 > h2")?.textContent).toBe("???");
    expect(element.querySelectorAll("script, svg, img, [onclick], [onerror], [onload], [onfocus], [onmouseover]"))
      .toHaveLength(0);
  });

  it("keeps source labels and dates while omitting unsafe source links", () => {
    const value = seed("/insights/new-jersey-homebuying-process");
    const hrefs = ["https://EXAMPLE.gov", "http://example.gov", "https://user:secret@example.gov", "javascript:bad()", "//example.gov"];
    value.insightArticle!.sources = hrefs.map((href, index) => ({
      tag: "SOURCE", text: `Public source ${index + 1}`, href, accessed: "2026-10-18",
    }));
    const element = parse(value);
    const sources = Array.from(element.querySelectorAll(".insight-sources .content-source-note"));

    expect(sources).toHaveLength(hrefs.length);
    expect(links(element.querySelectorAll(".insight-sources .content-source-note a")))
      .toEqual([{ label: "Public source 1", href: "https://example.gov/" }]);
    for (const [index, source] of sources.entries()) {
      expect(source.textContent).toContain(`Public source ${index + 1}`);
      expect(source.querySelector("span")?.textContent).toBe("Accessed 2026-10-18.");
    }
  });

  it.each(["/about", "/camden-county"])("does not add Insights content to %s", (path) => {
    expect(renderInsights(seed(path))).toBe("");
  });
});
