import { expect, test, type Page } from "@playwright/test";
import { insightArticles, insightIndex } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const buyerPath = "/insights/new-jersey-homebuying-process";
const dateLabel = (stamp: string) => new Intl.DateTimeFormat("en-US", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${stamp}T00:00:00Z`));

async function indexSnapshot(page: Page) {
  return page.locator(".insights-index-page").evaluate((root) => {
    const text = (element: Element | null) => element?.textContent || "";
    return {
      eyebrow: text(root.querySelector(".section-eyebrow")),
      title: text(root.querySelector("h1")),
      introduction: text(root.querySelector(".insights-index-hero > p:last-child")),
      cards: Array.from(root.querySelectorAll(".insight-card"), (card) => ({
        title: text(card.querySelector("h2 a")),
        href: card.querySelector("h2 a")?.getAttribute("href"),
        summary: text(card.querySelector(".insight-card-body > p:not(.insight-category):not(.insight-reviewed)")),
        category: text(card.querySelector(".insight-category")),
        reviewedDate: card.querySelector("time")?.getAttribute("datetime"),
        reviewedLabel: text(card.querySelector("time")),
        readHref: card.querySelector(".insight-read-link")?.getAttribute("href"),
      })),
    };
  });
}

async function articleSnapshot(page: Page) {
  return page.locator(".insight-article-page").evaluate((root) => {
    const text = (element: Element | null) => element?.textContent || "";
    return {
      eyebrow: text(root.querySelector(".section-eyebrow")),
      title: text(root.querySelector("h1")),
      summary: text(root.querySelector(".insight-article-summary")),
      notice: text(root.querySelector(".insight-article-notice")),
      metadata: Array.from(root.querySelectorAll(".insight-article-meta > span"), (span) => text(span)).slice(0, 3),
      dates: Array.from(root.querySelectorAll("time"), (time) => ({ stamp: time.getAttribute("datetime"), label: text(time) })),
      sections: Array.from(root.querySelectorAll(".insight-article-body > section:not(.insight-sources)"), (section) => ({
        anchor: section.id,
        heading: text(section.querySelector(":scope > h2")),
        paragraphs: Array.from(section.querySelectorAll(":scope > p:not(.insight-section-number)"), (paragraph) => text(paragraph)),
        checklist: Array.from(section.querySelectorAll(".insight-checklist li"), (item) => text(item)),
      })),
      sources: Array.from(root.querySelectorAll(".content-source-note"), (note) => ({
        title: text(note.querySelector("a")),
        href: note.querySelector("a")?.getAttribute("href"),
        accessed: text(note.querySelector("span")),
      })),
      related: Array.from(root.querySelectorAll(".insight-related-links a"), (link) => ({ label: text(link), href: link.getAttribute("href") })),
      contents: [".insight-contents-desktop", ".insight-contents-dropdown"].map((selector) => (
        Array.from(root.querySelectorAll(`${selector} a`), (link) => ({ label: text(link), href: link.getAttribute("href") }))
      )),
    };
  });
}

async function expectCompleteContent(page: Page, path: string) {
  if (path === "/insights") {
    expect(await indexSnapshot(page)).toEqual({
      eyebrow: insightIndex.eyebrow,
      title: insightIndex.title,
      introduction: insightIndex.introduction,
      cards: insightIndex.articles.map((card) => ({
        title: card.title, href: card.href, summary: card.summary, category: card.category,
        reviewedDate: card.reviewedDate, reviewedLabel: dateLabel(card.reviewedDate), readHref: card.href,
      })),
    });
    return;
  }
  const article = insightArticles[path];
  const snapshot = await articleSnapshot(page);
  const { sections, contents, ...body } = snapshot;
  expect(body).toEqual({
    eyebrow: article.eyebrow, title: article.title, summary: article.summary, notice: article.notice,
    metadata: [`By ${article.author}`, article.category, article.readingTime],
    dates: [article.reviewedDate, article.publishedDate, article.reviewedDate].map((stamp) => ({ stamp, label: dateLabel(stamp) })),
    sources: article.sources.filter((source) => source.tag === "SOURCE").map((source) => ({
      title: source.text, href: new URL(source.href!).href, accessed: `Accessed ${source.accessed}.`,
    })),
    related: article.relatedLinks,
  });
  expect(sections.map(({ anchor: _anchor, ...section }) => section)).toEqual(article.sections);
  expect(sections.every((section) => section.anchor)).toBe(true);
  for (const list of contents) {
    expect(list).toEqual(sections.map((section) => ({ label: section.heading, href: `#${section.anchor}` })));
  }
}

async function expectSingleCompletePage(page: Page) {
  await expect(page.locator("#page h1")).toHaveCount(1);
  await expect(page.locator("#page .standard-page")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Explore this website", exact: true })).toHaveCount(0);
  const ids = await page.locator("#page [id]").evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
}

test("all nine Insights routes serve their complete accepted content in the initial HTML", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    expect(insightIndex.articles).toHaveLength(8);
    expect(Object.keys(insightArticles)).toHaveLength(8);
    for (const path of ["/insights", ...Object.keys(insightArticles)]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      const html = await response!.text();
      expect(html).toContain('data-seo-prerendered="true"');
      expect(html).toContain(path === "/insights" ? 'class="insights-index-page"' : 'class="insight-article-page"');
      await expectCompleteContent(page, path);
      await expectSingleCompletePage(page);
      await expect(page.locator("#page script, #page iframe, #page object, #page embed")).toHaveCount(0);
      expect(await page.locator("#page *").evaluateAll((elements) => elements.every((element) => (
        Array.from(element.attributes).every((attribute) => !/^on/i.test(attribute.name))
      )))).toBe(true);
    }
  } finally {
    await context.close();
  }
});

test("guides, article anchors and related next steps work without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.goto("/insights", { waitUntil: "domcontentloaded" });
    await page.locator(".insight-card h2").getByRole("link", { name: insightArticles[buyerPath].title, exact: true }).click();
    await expect(page).toHaveURL(buyerPath);
    const anchor = "#understand-who-represents-whom";
    await page.locator(".insight-contents-desktop").getByRole("link", { name: "Understand who represents whom", exact: true }).click();
    await expect(page).toHaveURL(`${buyerPath}${anchor}`);
    await expect.poll(() => page.locator(`${anchor} > h2`).evaluate((heading) => {
      const top = heading.getBoundingClientRect().top;
      return top >= document.querySelector(".site-header")!.getBoundingClientRect().bottom - 1 && top < window.innerHeight;
    })).toBe(true);
    await expect(page.locator(`${anchor} > p:not(.insight-section-number)`).first()).toHaveText(insightArticles[buyerPath].sections[1].paragraphs[0]);
    const related = insightArticles[buyerPath].relatedLinks.find((link) => link.href.startsWith("/insights/"))!;
    const relatedLink = page.locator(".insight-related-links").getByRole("link", { name: related.label, exact: true });
    await relatedLink.evaluate((link) => link.scrollIntoView({ behavior: "instant", block: "center" }));
    await relatedLink.click();
    await expect(page).toHaveURL(related.href);
    await expect(page.locator("#page h1")).toHaveText(insightArticles[related.href].title);
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(1);
  } finally {
    await context.close();
  }
});

for (const { width, theme } of [{ width: 1440, theme: "light" }, { width: 390, theme: "dark" }] as const) {
  test(`Insights keeps complete content and its layout after the app starts at ${width}px in ${theme}`, async ({ browser, page, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width, height: 1000 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("analytics-consent", "denied");
      localStorage.setItem("site-theme", selectedTheme);
    }, theme);
    await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
    try {
      const initial = await context.newPage();
      for (const path of ["/insights", buyerPath]) {
        await initial.goto(path, { waitUntil: "domcontentloaded" });
        const before = path === "/insights" ? await indexSnapshot(initial) : await articleSnapshot(initial);
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(path === "/insights" ? await indexSnapshot(page) : await articleSnapshot(page)).toEqual(before);
        await expectSingleCompletePage(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
        expect(await page.locator(".insight-card, .insight-article-hero h1, .insight-article-body").evaluateAll((elements) => elements.every((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
        }))).toBe(true);
        if (path === buyerPath) {
          expect(await page.locator(".insight-article-layout").evaluate((element) => getComputedStyle(element).display))
            .toBe(width > 760 ? "grid" : "block");
          await expect(page.locator(".insight-contents-desktop")).toBeVisible({ visible: width > 760 });
          await expect(page.locator(".insight-contents-dropdown")).toBeVisible({ visible: width <= 760 });
        }
        expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
      }
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
