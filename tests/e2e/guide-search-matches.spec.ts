import { expect, test, type Locator, type Page } from "@playwright/test";
import { insightArticles, insightIndex, type InsightArticleContent } from "../../src/content/insights";
import { insightSectionId } from "../../src/content/insightSections";

// Browser plugin not available; use the repository's configured Playwright browser.
const buyerPath = "/insights/new-jersey-homebuying-process";
const inspectionPath = "/insights/home-inspections-and-repair-questions";
const inputFor = (page: Page) => page.getByRole("searchbox", { name: "Find a guide", exact: true });
const allCards = (page: Page) => page.locator("#guide-finder-results .insight-card");
const cardFor = (page: Page, path: string) => allCards(page).filter({ has: page.locator(`h2 a[href="${path}"]`) });
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const cleanExcerpt = (value: string) => value.replace(/^(?:…|\.{3})\s*|\s*(?:…|\.{3})$/g, "").replace(/\s+/g, " ").trim();
const observed = new WeakMap<Page, { errors: string[]; submissions: string[] }>();

const deepMatches = [
  { path: buyerPath, query: "post-closing reserves", section: 0 },
  { path: "/insights/preparing-to-sell-a-new-jersey-home", query: "deed ownership", section: 0 },
  { path: "/insights/researching-a-south-jersey-property", query: "elevation certificate", section: 2 },
  { path: inspectionPath, query: "radon", section: 0 },
  { path: "/insights/municipal-records-permits-and-zoning", query: "block lot", section: 0 },
  { path: "/insights/questions-before-choosing-a-community", query: "non-negotiable daily trips", section: 0 },
  { path: "/insights/coastal-property-due-diligence", query: "bulkheads docks", section: 2 },
  { path: "/insights/wells-septic-acreage-and-environmental-constraints", query: "pumping records", section: 2 },
  { path: "/insights/working-with-a-real-estate-agent-in-new-jersey", query: "designated agency", section: 2 },
];

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    try { localStorage.setItem("analytics-consent", "denied"); } catch { /* Opaque initial document. */ }
  });
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const record = { errors: [] as string[], submissions: [] as string[] };
  observed.set(page, record);
  page.on("pageerror", (error) => record.errors.push(error.message));
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
    record.submissions.push(route.request().url());
    return route.abort();
  });
});

test.afterEach(async ({ page }) => {
  expect(observed.get(page)!.errors).toEqual([]);
  expect(observed.get(page)!.submissions).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
});

async function settleLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function openFinder(page: Page) {
  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(inputFor(page)).toBeEnabled();
  await settleLayout(page);
  return inputFor(page);
}

async function expectOriginalLinks(card: Locator, path: string) {
  await expect(card.locator("h2 a")).toHaveAttribute("href", path);
  await expect(card.locator(".insight-read-link:not(.insight-match-link)")).toHaveAttribute("href", path);
}

async function expectExcerpt(card: Locator, query: string, sourceFields: string[]) {
  const excerpt = card.locator(".insight-match-excerpt");
  await expect(excerpt).toBeVisible();
  const text = (await excerpt.innerText()).trim();
  expect(text.length).toBeGreaterThan(0);
  expect(text.length).toBeLessThanOrEqual(240);
  const passage = cleanExcerpt(text);
  expect(sourceFields.some((field) => field.replace(/\s+/g, " ").includes(passage))).toBe(true);
  for (const token of normalized(query).split(" ")) expect(normalized(text)).toContain(token);
}

async function expectSectionDestination(page: Page, path: string, heading: string, index: number) {
  const hash = `#${insightSectionId(heading, index)}`;
  await expect(page).toHaveURL(`${path}${hash}`);
  const section = page.locator(hash);
  await expect(section).toBeFocused();
  await expect(section.locator(":scope > h2")).toHaveText(heading);
  await expect.poll(() => section.locator(":scope > h2").evaluate((element) => {
    const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    const contentsBottom = matchMedia("(max-width: 760px)").matches
      ? document.querySelector(".insight-table-of-contents")!.getBoundingClientRect().bottom : headerBottom;
    const top = element.getBoundingClientRect().top;
    return top >= Math.max(headerBottom, contentsBottom) - 1 && top < window.innerHeight;
  })).toBe(true);
}

function publishedRows(article: InsightArticleContent, index = structuredClone(insightIndex)) {
  return [
    { page_key: "/insights", published_at: "2026-10-19T12:00:00Z", published_content: { insightIndex: index, insightIndexVersion: 2 } },
    { page_key: buyerPath, published_at: "2026-10-19T12:00:00Z", published_content: { insightArticle: article, insightContactLinksVersion: 1 } },
  ];
}

test("all nine guide body topics expose real excerpts and matching sections without replacing full-guide links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const input = await openFinder(page);
  expect(new Set(deepMatches.map((match) => match.path))).toEqual(new Set(insightIndex.articles.map((card) => card.href)));
  for (const match of deepMatches) {
    const section = insightArticles[match.path].sections[match.section];
    await input.fill(match.query);
    const card = cardFor(page, match.path);
    await expectExcerpt(card, match.query, [section.heading, ...section.paragraphs, ...section.checklist]);
    await expect(card.locator(".insight-match-link"))
      .toHaveAttribute("href", `${match.path}#${insightSectionId(section.heading, match.section)}`);
    await expectOriginalLinks(card, match.path);
  }
  for (const query of ["", "!!! … ???"]) {
    await input.fill(query);
    await expect(allCards(page)).toHaveCount(insightIndex.articles.length);
    await expect(page.locator(".insight-match-excerpt, .insight-match-link")).toHaveCount(0);
  }
});

for (const scenario of [
  { name: "desktop light", theme: "light", viewport: { width: 1440, height: 1000 } },
  { name: "mobile dark", theme: "dark", viewport: { width: 390, height: 844 } },
] as const) {
  test(`matching-section navigation focuses clear of sticky headers and restores its search on ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.addInitScript((theme) => localStorage.setItem("site-theme", theme), scenario.theme);
    const input = await openFinder(page);
    await input.fill("radon");
    const card = cardFor(page, inspectionPath);
    const link = card.locator(".insight-match-link");
    await link.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await settleLayout(page);
    const finderY = await page.evaluate(() => scrollY);
    expect(finderY).toBeGreaterThan(0);
    await link.click();
    const section = insightArticles[inspectionPath].sections[0];
    await expectSectionDestination(page, inspectionPath, section.heading, 0);
    await page.evaluate(() => window.scrollBy({ top: 140, behavior: "instant" }));
    await settleLayout(page);
    const articleY = await page.evaluate(() => scrollY);
    await page.goBack();
    await expect(page).toHaveURL("/insights");
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("radon");
    await expect(card.locator(".insight-match-link")).toBeVisible();
    await expectOriginalLinks(card, inspectionPath);
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - finderY)).toBeLessThanOrEqual(2);
    await page.goForward();
    await expect(page).toHaveURL(`${inspectionPath}#${insightSectionId(section.heading, 0)}`);
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - articleY)).toBeLessThanOrEqual(2);
  });
}

test("modified and middle matching-section clicks preserve the search and open the actual anchored section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const input = await openFinder(page);
  await input.fill("radon");
  const section = insightArticles[inspectionPath].sections[0];
  for (const method of ["modified", "middle"] as const) {
    await page.bringToFront();
    const link = cardFor(page, inspectionPath).locator(".insight-match-link");
    await link.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await settleLayout(page);
    const finderY = await page.evaluate(() => scrollY);
    const [opened] = await Promise.all([
      page.context().waitForEvent("page"),
      method === "middle" ? link.click({ button: "middle" }) : link.click({ modifiers: ["ControlOrMeta"] }),
    ]);
    try {
      await opened.bringToFront();
      await expectSectionDestination(opened, inspectionPath, section.heading, 0);
      await expect(page).toHaveURL("/insights");
      await expect(input).toHaveValue("radon");
      await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - finderY)).toBeLessThanOrEqual(2);
    } finally {
      await opened.close();
      await page.bringToFront();
    }
  }
});

test("published paragraphs, checklists and reordered headings determine the jump while removed content stays absent", async ({ page }) => {
  const article = structuredClone(insightArticles[buyerPath]);
  article.sections = [
    { heading: "Owner's reordered later step", paragraphs: ["The accepted paragraphneedle passage replaces the prior draft."], checklist: [] },
    { heading: "Owner's current checklist step", paragraphs: ["Keep the reviewed records together."], checklist: ["Check the accepted checklistneedle record before proceeding."] },
    { heading: "Headingneedle reviewed step", paragraphs: ["Use the owner's accepted research sequence."], checklist: [] },
  ];
  const index = structuredClone(insightIndex);
  index.articles = index.articles.filter((card) => card.href !== inspectionPath);
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(publishedRows(article, index)) }));
  const input = await openFinder(page);
  for (const [sectionIndex, query] of ["paragraphneedle", "checklistneedle", "headingneedle"].entries()) {
    await input.fill(query);
    const section = article.sections[sectionIndex];
    const card = cardFor(page, buyerPath);
    await expectExcerpt(card, query, [section.heading, ...section.paragraphs, ...section.checklist]);
    await expect(card.locator(".insight-match-link"))
      .toHaveAttribute("href", `${buyerPath}#${insightSectionId(section.heading, sectionIndex)}`);
  }
  await input.fill("paragraphneedle");
  await cardFor(page, buyerPath).locator(".insight-match-link").click();
  await expectSectionDestination(page, buyerPath, article.sections[0].heading, 0);
  await expect(page.locator(".insight-article-body")).toContainText(article.sections[0].paragraphs[0]);
  await page.goBack();
  await expect(input).toBeEnabled();
  for (const query of ["post-closing reserves", "radon"]) {
    await input.fill(query);
    await expect(allCards(page)).toHaveCount(0);
    await expect(page.locator(".insight-match-link")).toHaveCount(0);
  }
});

test("metadata, sources, cross-section terms and duplicate headings keep a full guide without inventing a section jump", async ({ page }) => {
  const article = structuredClone(insightArticles[buyerPath]);
  article.category = "Metadataatlas reviewed category";
  article.sources[0].text = "Sourcearchiveonlystone public record";
  article.sections = [
    { heading: "Repeated owner heading", paragraphs: ["Dupeledger belongs to the first accepted section."], checklist: [] },
    { heading: "Repeated owner heading", paragraphs: ["A different passage shares the same heading."], checklist: [] },
    { heading: "Owner's first distinct section", paragraphs: ["Amberledger belongs to this accepted section."], checklist: [] },
    { heading: "Owner's second distinct section", paragraphs: ["Copperroute belongs to a different accepted section."], checklist: [] },
  ];
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(publishedRows(article)) }));
  const input = await openFinder(page);
  for (const query of ["metadataatlas", "sourcearchiveonlystone", "amberledger copperroute", "dupeledger"]) {
    await input.fill(query);
    const card = cardFor(page, buyerPath);
    await expect(card).toBeVisible();
    await expectOriginalLinks(card, buyerPath);
    await expect(card.locator(".insight-match-link")).toHaveCount(0);
  }
});

test("matching excerpts remain literal text and search queries never enter requests, URLs or analytics", async ({ page }) => {
  const article = structuredClone(insightArticles[buyerPath]);
  const payload = 'Owner reviewed needleharbor notes include <img src=x onerror="window.matchFixtureRan=true"> and <script>window.matchFixtureRan=true</script>.';
  article.sections = [{ heading: "Owner's current research step", paragraphs: [payload], checklist: [] }];
  let requests = 0;
  await page.route("**/rest/v1/site_pages?*", (route) => {
    requests += 1;
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(publishedRows(article)) });
  });
  const input = await openFinder(page);
  const transmissions: string[] = [];
  page.on("request", (request) => transmissions.push(`${request.url()} ${request.postData() || ""}`));
  const privateQuery = "SJRE confidential matching fixture 42187";
  await input.fill(privateQuery);
  await expect(allCards(page)).toHaveCount(0);
  await input.fill("needleharbor");
  const card = cardFor(page, buyerPath);
  await expect(card.locator(".insight-match-excerpt")).toHaveText(payload);
  await expect(card.locator(".insight-search-match img, .insight-search-match script, .insight-search-match iframe")).toHaveCount(0);
  await expect(card.locator(".insight-match-link"))
    .toHaveAttribute("href", `${buyerPath}#${insightSectionId(article.sections[0].heading, 0)}`);
  expect(await page.evaluate(() => "matchFixtureRan" in window)).toBe(false);
  await expect(page).toHaveURL("/insights");
  expect(requests).toBe(1);
  expect(transmissions.some((transmission) => decodeURIComponent(transmission).includes(privateQuery))).toBe(false);
  expect(transmissions.filter((transmission) => /google-analytics|googletagmanager|doubleclick/i.test(transmission))).toEqual([]);
});
