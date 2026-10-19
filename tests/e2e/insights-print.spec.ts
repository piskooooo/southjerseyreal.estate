import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { insightArticles } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
// Flow: open any guide -> browser Print / Save as PDF -> complete paper copy -> return to the same screen layout.
const guidePaths = Object.keys(insightArticles);
const canonicalSiteUrl = "https://southjerseyreal.estate";
const compliance = JSON.parse(readFileSync(
  new URL("../../src/content/complianceData.json", import.meta.url), "utf8",
)) as Record<string, string>;
const dateLabel = (stamp: string) => new Intl.DateTimeFormat("en-US", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${stamp}T00:00:00Z`));

async function screenSnapshot(page: Page) {
  return page.evaluate(() => {
    const selectors = [
      "body", ".site-header", ".insight-article-hero", ".insight-print-site", ".insight-article-hero h1",
      ".insight-article-summary", ".insight-article-layout", ".insight-table-of-contents",
      ".insight-article-body", ".insight-article-body h2", ".insight-article-notice",
      ".insight-checklist", ".insight-checklist li", ".content-source-note a",
      ".insight-related-section", ".site-footer", ".brokerage-disclosure-footer",
    ];
    return selectors.map((selector) => {
      const element = document.querySelector(selector)!;
      const style = getComputedStyle(element);
      return {
        selector,
        display: style.display,
        position: style.position,
        background: style.backgroundColor,
        color: style.color,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        columns: style.gridTemplateColumns,
        padding: style.padding,
        border: style.border,
        width: style.width,
        maxWidth: style.maxWidth,
      };
    });
  });
}

async function expectPrintedContent(page: Page, path: string) {
  const article = insightArticles[path];
  const printedArticle = page.locator(".insight-article-page");
  const siteIdentity = printedArticle.locator(".insight-print-site");
  await expect(siteIdentity).toBeVisible();
  await expect(siteIdentity).toHaveText(new URL(canonicalSiteUrl).hostname);
  await expect(siteIdentity).toHaveAttribute("href", canonicalSiteUrl);
  await expect(printedArticle.locator("h1")).toHaveText(article.title);
  await expect(printedArticle.locator(".insight-article-summary")).toHaveText(article.summary);
  await expect(printedArticle.locator(".insight-article-notice")).toHaveText(article.notice);
  await expect(printedArticle).toContainText(`By ${article.author}`);
  await expect(printedArticle).toContainText(article.category);
  await expect(printedArticle).toContainText(`Reviewed ${dateLabel(article.reviewedDate)}`);

  const sections = page.locator(".insight-article-body > section:not(.insight-sources)");
  await expect(sections).toHaveCount(article.sections.length);
  for (const [index, section] of article.sections.entries()) {
    const rendered = sections.nth(index);
    await expect(rendered).toBeVisible();
    await expect(rendered.locator(":scope > h2")).toHaveText(section.heading);
    await expect(rendered.locator(":scope > p:not(.insight-section-number)")).toHaveText(section.paragraphs);
    await expect(rendered.locator(".insight-checklist li")).toHaveText(section.checklist);
  }

  const sources = article.sources.filter((source) => source.tag === "SOURCE");
  await expect(page.locator(".insight-sources")).toBeVisible();
  await expect(page.locator(".insight-sources > p").first()).toContainText(`Published ${dateLabel(article.publishedDate)}.`);
  await expect(page.locator(".insight-sources > p").first()).toContainText(`Last reviewed ${dateLabel(article.reviewedDate)}.`);
  await expect(page.locator(".content-source-note")).toHaveCount(sources.length);
  for (const [index, source] of sources.entries()) {
    const note = page.locator(".content-source-note").nth(index);
    const link = note.locator("a");
    await expect(note).toBeVisible();
    await expect(link).toHaveText(source.text);
    await expect(link).toHaveAttribute("href", new URL(source.href!).href);
    await expect(note).toContainText(`Accessed ${source.accessed}.`);
    const typography = await note.evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) };
    });
    expect(typography.fontSize).toBeCloseTo(8.5 * 96 / 72, 2);
    expect(typography.lineHeight / typography.fontSize).toBeCloseTo(1.4, 2);
    // A paper copy retains the destination as well as the clickable PDF link.
    expect(await link.evaluate((element) => getComputedStyle(element, "::after").content))
      .toContain(source.href!);
  }

  expect(await page.locator(".insight-checklist li").evaluateAll((items) => items.every((item) => {
    const box = getComputedStyle(item, "::before");
    return box.content !== "none" && Number.parseFloat(box.width) > 0
      && Number.parseFloat(box.height) > 0 && Number.parseFloat(box.borderTopWidth) > 0;
  }))).toBe(true);

  const disclosure = page.locator(".brokerage-disclosure-footer");
  await expect(disclosure).toBeVisible();
  for (const fact of [compliance.brokerLegalName, compliance.brokerDescriptor, compliance.licensedOfficePhone,
    compliance.agentLicensedName, compliance.agentLicenseType, compliance.agentLicenseNumber]) {
    await expect(disclosure).toContainText(fact);
  }
  expect(await disclosure.evaluate((element) => (
    Number.parseFloat(getComputedStyle(element.querySelector(".brokerage-legal-name")!).fontSize)
      > Number.parseFloat(getComputedStyle(element.querySelector(".agent-license-disclosure")!).fontSize)
  ))).toBe(true);
  await expect(page.locator(".fair-housing-notice")).toBeVisible();
  await expect(page.locator(".fair-housing-notice")).toContainText("Equal Housing Opportunity");
  await expect(page.locator(".footer-credential-logos")).toBeHidden();
}

for (const { width, theme, paper } of [
  { width: 1440, theme: "light", paper: "Letter" },
  { width: 390, theme: "dark", paper: "A4" },
] as const) {
  test(`all eight guides print complete, readable ${paper} copies from ${theme} and restore their ${width}px screen layout`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("analytics-consent", "denied");
      localStorage.setItem("site-theme", selectedTheme);
    }, theme);
    await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));

    expect(guidePaths).toHaveLength(8);
    for (const path of guidePaths) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("body")).toHaveCSS("background-color", theme === "light" ? "rgb(255, 255, 255)" : "rgb(10, 14, 20)");
      await expect(page.locator(".insight-print-site")).toBeHidden();
      const before = await screenSnapshot(page);
      await page.emulateMedia({ media: "print" });
      await expectPrintedContent(page, path);
      for (const selector of [".site-header", ".insight-back-link", ".insight-print-action", ".insight-table-of-contents",
        ".insight-related-section", ".site-footer-links", ".footer-privacy-button", ".privacy-banner"]) {
        await expect(page.locator(selector)).toBeHidden();
      }
      expect(await page.locator(".insight-article-layout").evaluate((element) => getComputedStyle(element).display)).toBe("contents");
      expect(await page.locator(".insight-article-body > section:not(.insight-sources)").evaluateAll((elements) => elements.every((element) => (
        getComputedStyle(element).display === "block"
      )))).toBe(true);
      expect(await page.locator("body").evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
      expect(await page.locator(".insight-article-hero, .insight-article-body > section:not(.insight-sources), .insight-checklist, .content-source-note, .site-footer").evaluateAll((elements) => elements.every((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
      }))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      expect(await page.locator(".insight-article-hero h1, .insight-article-summary, .insight-article-notice, .insight-article-body h2, .insight-checklist li, .content-source-note a, .brokerage-disclosure-footer, .fair-housing-notice p").evaluateAll((elements) => elements.every((element) => {
        const channels = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number);
        return channels && channels.slice(0, 3).every((channel) => channel <= 85);
      }))).toBe(true);

      const pdf = await page.pdf({ format: paper, preferCSSPageSize: true, printBackground: false });
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(10_000);

      await page.emulateMedia({ media: "screen" });
      await expect.poll(() => screenSnapshot(page)).toEqual(before);
      await expect(page.locator(".insight-print-site")).toBeHidden();
      await expect(page.locator(".site-header")).toBeVisible();
      await expect(page.locator(".insight-related-section")).toBeVisible();
      await expect(page.locator(".insight-contents-desktop")).toBeVisible({ visible: width > 760 });
      await expect(page.locator(".insight-contents-dropdown")).toBeVisible({ visible: width <= 760 });
    }
    expect(errors).toEqual([]);
  });
}
