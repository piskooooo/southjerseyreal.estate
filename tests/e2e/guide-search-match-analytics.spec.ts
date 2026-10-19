import { expect, test, type Page } from "@playwright/test";
import { insightArticles, insightIndex } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const articlePath = "/insights/home-inspections-and-repair-questions";
const query = "quartzscope";
const sectionHeading = "Published quartzscope research checkpoint";
const sectionId = "published-quartzscope-research-checkpoint";
const publishedParagraph = "The owner's published quartzscope paragraph explains how to keep the reviewed inspection record with the property documents.";
const ownerHref = `https://southjerseyreal.estate${articlePath}?owner_note=curated-reading#owner-selected-start`;
const matchingHref = `${articlePath}?owner_note=curated-reading#${sectionId}`;

async function analyticsEvents(page: Page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "event"));
}

async function settleLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

test("a consented matching-section visit keeps published anchors and Back state without tracking search content", async ({ context, page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await context.addInitScript(() => {
    localStorage.setItem("analytics-consent", "granted");
    localStorage.setItem("site-theme", "light");
  });
  // Keep the real consented tracking path, with no Google script or collection requests leaving the test.
  await context.route(/https:\/\/[^/]*(?:google-analytics|googletagmanager|doubleclick|googleadservices|analytics\.google)[^/]*\//, (route) => (
    route.request().resourceType() === "script"
      ? route.fulfill({ contentType: "application/javascript", body: "" })
      : route.fulfill({ status: 204, body: "" })
  ));
  const submissions: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
    submissions.push(route.request().url());
    return route.abort();
  });

  const index = structuredClone(insightIndex);
  index.articles.find((card) => card.href === articlePath)!.href = ownerHref;
  const articles = Object.entries(insightArticles).map(([path, seed]) => {
    const article = structuredClone(seed);
    if (path === articlePath) article.sections.push({
      heading: sectionHeading,
      paragraphs: [publishedParagraph],
      checklist: ["Keep the reviewed inspection record with the property documents."],
    });
    return {
      page_key: path,
      published_at: "2026-10-19T12:00:00Z",
      published_content: { insightArticle: article, insightContactLinksVersion: 1 },
    };
  });
  expect(articles).toHaveLength(9);
  const libraryRows = [{
    page_key: "/insights",
    published_at: "2026-10-19T12:00:00Z",
    published_content: { insightIndex: index, insightIndexVersion: 2 },
  }, ...articles];
  let releaseArticle!: () => void;
  const articleReady = new Promise<void>((resolve) => { releaseArticle = resolve; });
  let articleRequested = false;
  await context.route("**/rest/v1/site_pages?*", async (route) => {
    const requestedKeys = new URL(route.request().url()).searchParams.get("page_key")!.slice(4, -1).split(",");
    if (requestedKeys.includes("/insights")) {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(libraryRows) });
      return;
    }
    if (requestedKeys.includes(articlePath)) {
      articleRequested = true;
      await articleReady;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(articles.filter((row) => requestedKeys.includes(row.page_key))) });
  });

  try {
    await page.goto("/insights", { waitUntil: "domcontentloaded" });
    const input = page.getByRole("searchbox", { name: "Find a guide", exact: true });
    await expect(input).toBeEnabled();
    await expect(page.locator("#guide-finder-results .insight-card")).toHaveCount(9);
    await expect.poll(async () => (await analyticsEvents(page)).filter((entry) => entry[1] === "page_view").length).toBe(1);
    await settleLayout(page);
    const beforeTyping = await analyticsEvents(page);

    await input.fill(query);
    const card = page.locator("#guide-finder-results .insight-card");
    await expect(card).toHaveCount(1);
    await expect(card.locator("h2 a")).toHaveAttribute("href", ownerHref);
    await expect(card.locator(".insight-read-link")).toHaveAttribute("href", ownerHref);
    await expect(card.locator(".insight-match-excerpt")).toContainText(/quartzscope/i);
    const excerpt = (await card.locator(".insight-match-excerpt").innerText()).trim();
    const matchingLink = card.locator(".insight-match-link");
    await expect(matchingLink).toHaveText("Read matching section");
    await expect(matchingLink).toHaveAttribute("aria-label", `Read matching section: ${sectionHeading} — ${insightArticles[articlePath].title}`);
    await expect(matchingLink).toHaveAttribute("href", matchingHref);
    await expect(page).toHaveURL("/insights");
    expect(await analyticsEvents(page)).toEqual(beforeTyping);

    await matchingLink.evaluate((link) => link.scrollIntoView({ block: "center", behavior: "instant" }));
    await settleLayout(page);
    const finderY = await page.evaluate(() => window.scrollY);
    expect(finderY).toBeGreaterThan(0);
    await page.locator("html").evaluate((element) => { element.setAttribute("data-search-match-document", "same"); });
    await matchingLink.click();
    await expect.poll(() => articleRequested).toBe(true);
    await expect(page).toHaveURL(matchingHref);
    await expect(page.locator("html")).toHaveAttribute("data-search-match-document", "same");
    expect(await page.evaluate(() => window.location.hash)).toBe(`#${sectionId}`);
    expect((await analyticsEvents(page)).filter((entry) => (
      entry[1] === "page_view" && (entry[2] as { page_path?: string })?.page_path === articlePath
    ))).toEqual([]);

    const response = page.waitForResponse((item) => {
      const url = new URL(item.url());
      return url.pathname.endsWith("/rest/v1/site_pages")
        && url.searchParams.get("page_key") === `in.(__sitewide__,${articlePath})`;
    });
    releaseArticle();
    await response;
    await expect.poll(async () => (await analyticsEvents(page)).filter((entry) => (
      entry[1] === "page_view" && (entry[2] as { page_path?: string })?.page_path === articlePath
    )).length).toBe(1);
    await expect(page).toHaveURL(`${articlePath}#${sectionId}`);
    const section = page.locator(`#${sectionId}`);
    await expect(section).toBeFocused();
    await expect(section).toContainText(publishedParagraph);
    await expect.poll(() => section.locator("h2").evaluate((heading) => {
      const top = heading.getBoundingClientRect().top;
      const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
      return top >= headerBottom - 1 && top < window.innerHeight;
    })).toBe(true);

    const events = await analyticsEvents(page);
    expect(events.filter((entry) => entry[1] === "internal_link_click")).toEqual([
      ["event", "internal_link_click", {
        destination_type: "internal",
        link_source: "insights_search_match",
        link_url: articlePath,
      }],
    ]);
    const payload = JSON.stringify(events);
    for (const privateValue of [query, excerpt, sectionHeading, publishedParagraph, "owner_note", "curated-reading", "owner-selected-start", sectionId]) {
      expect(payload).not.toContain(privateValue);
    }

    await page.goBack();
    await expect(page).toHaveURL("/insights");
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue(query);
    await expect(card).toHaveCount(1);
    await expect(matchingLink).toHaveAttribute("href", matchingHref);
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - finderY)).toBeLessThanOrEqual(2);
    expect(submissions).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    releaseArticle();
  }
});

test("accepted long and personal-data-like headings retain excerpts without offering a hash that consented analytics removes", async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem("analytics-consent", "granted"));
  await context.route(/https:\/\/[^/]*(?:google-analytics|googletagmanager|doubleclick|googleadservices|analytics\.google)[^/]*\//, (route) => (
    route.request().resourceType() === "script"
      ? route.fulfill({ contentType: "application/javascript", body: "" })
      : route.fulfill({ status: 204, body: "" })
  ));
  const headings = [
    { query: "longheadingneedle", heading: `Published longheadingneedle ${"reviewed property notes ".repeat(9)}checkpoint` },
    { query: "numericneedle", heading: "Published numericneedle record 1234567890" },
  ];
  const article = structuredClone(insightArticles[articlePath]);
  article.sections = headings.map(({ query, heading }) => ({
    heading,
    paragraphs: [`The accepted ${query} passage remains available to readers.`],
    checklist: [],
  }));
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{
      page_key: articlePath,
      published_at: "2026-10-19T12:00:00Z",
      published_content: { insightArticle: article, insightContactLinksVersion: 1 },
    }]),
  }));
  const submissions: string[] = [];
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
    submissions.push(route.request().url());
    return route.abort();
  });

  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("searchbox", { name: "Find a guide", exact: true });
  await expect(input).toBeEnabled();
  await expect.poll(async () => (await analyticsEvents(page)).filter((entry) => entry[1] === "page_view").length).toBe(1);
  const beforeTyping = await analyticsEvents(page);
  for (const { query } of headings) {
    await input.fill(query);
    const card = page.locator("#guide-finder-results .insight-card");
    await expect(card).toHaveCount(1);
    await expect(card.locator(".insight-match-excerpt")).toContainText(query);
    await expect(card.locator(".insight-match-link")).toHaveCount(0);
    await expect(card.locator("h2 a")).toHaveAttribute("href", articlePath);
    await expect(card.locator(".insight-read-link")).toHaveAttribute("href", articlePath);
  }
  await expect(page).toHaveURL("/insights");
  expect(await analyticsEvents(page)).toEqual(beforeTyping);
  expect(submissions).toEqual([]);
});
