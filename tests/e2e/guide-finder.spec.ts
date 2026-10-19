import { expect, test, type Locator, type Page } from "@playwright/test";
import { insightArticles, insightIndex } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const guidePaths = insightIndex.articles.map((card) => card.href);
const inspectionPath = "/insights/home-inspections-and-repair-questions";
const agentGuidePath = "/insights/working-with-a-real-estate-agent-in-new-jersey";
const inspectionNumber = String(guidePaths.indexOf(inspectionPath) + 1).padStart(2, "0");
const cards = (page: Page) => page.locator("#guide-finder-results .insight-card");
const titleLinks = (page: Page) => cards(page).locator("h2 a");
const inputFor = (page: Page) => page.getByRole("searchbox", { name: "Find a guide", exact: true });
const searchFor = (page: Page) => page.getByRole("search", { name: "Guide library", exact: true });
const observations = new WeakMap<Page, { errors: string[]; submissions: string[] }>();

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem("analytics-consent", "denied");
    } catch {
      // A native new tab can briefly have an opaque initial document.
    }
  });
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const recorded = { errors: [] as string[], submissions: [] as string[] };
  observations.set(page, recorded);
  page.on("pageerror", (error) => recorded.errors.push(error.message));
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
    recorded.submissions.push(route.request().url());
    return route.abort();
  });
});

test.afterEach(async ({ page }) => {
  const recorded = observations.get(page)!;
  expect(recorded.errors).toEqual([]);
  expect(recorded.submissions).toEqual([]);
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

const readY = (page: Page) => page.evaluate(() => window.scrollY);
async function expectY(page: Page, y: number) {
  await expect.poll(async () => Math.abs(await readY(page) - y)).toBeLessThanOrEqual(2);
}

async function expectArticle(page: Page, path: string) {
  await expect(page).toHaveURL(path);
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("#page h1")).toHaveText(insightArticles[path].title);
}

// Partial published documents follow the same accepted merge path as the editor.
function publishedLibrary(version = 2) {
  const index = structuredClone(insightIndex);
  const markers = guidePaths.map((_path, index) => `reviewedarchive${index + 1}record`);
  const articles = guidePaths.map((path, index) => {
    const article = structuredClone(insightArticles[path]);
    article.sections = [{
      heading: "Reviewed property research steps",
      paragraphs: [index % 3 === 0 ? `The owner's published paragraph discusses ${markers[index]}.` : "The owner selected this published paragraph."],
      checklist: [index % 3 === 1 ? `Check the published ${markers[index]} record.` : "Keep the reviewed property records together."],
    }];
    if (index % 3 === 2) article.sources[0].text = `Published public source ${markers[index]}`;
    return { path, article };
  });
  const rows = () => [
    { page_key: "/insights", published_at: "2026-10-19T12:00:00Z", published_content: { insightIndex: index, insightIndexVersion: version } },
    ...articles.map(({ path, article }) => ({
      page_key: path, published_at: "2026-10-19T12:00:00Z",
      published_content: { insightArticle: article, insightContactLinksVersion: 1 },
    })),
  ];
  return { index, markers, articles, rows };
}

test("finds full-article topics while preserving the existing cards and their original numbers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const input = await openFinder(page);
  await expect(cards(page)).toHaveCount(guidePaths.length);
  expect(guidePaths).toContain(agentGuidePath);
  await expect(titleLinks(page)).toHaveText(insightIndex.articles.map((card) => card.title));
  await expect(cards(page).locator(".insight-card-number")).toHaveText(guidePaths.map((_path, index) => String(index + 1).padStart(2, "0")));
  const originalCardWidth = await cards(page).first().evaluate((card) => card.getBoundingClientRect().width);

  await input.fill("radon");
  await expect(titleLinks(page)).toHaveCount(1);
  await expect(titleLinks(page)).toHaveAttribute("href", inspectionPath);
  await expect(cards(page).locator(".insight-card-number")).toHaveText(inspectionNumber);
  const singleResult = await cards(page).evaluate((card) => ({
    cardWidth: card.getBoundingClientRect().width,
    gridWidth: card.closest("#guide-finder-results")!.getBoundingClientRect().width,
  }));
  expect(Math.abs(singleResult.cardWidth - originalCardWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(singleResult.gridWidth - singleResult.cardWidth)).toBeLessThanOrEqual(2);
  await input.fill("flood insurance");
  await expect.poll(() => cards(page).count()).toBeGreaterThan(1);
  for (const path of [guidePaths[0], guidePaths[2], guidePaths[6]]) {
    await expect(page.locator(`#guide-finder-results .insight-card h2 a[href="${path}"]`)).toHaveCount(1);
  }
  const numbers = await cards(page).locator(".insight-card-number").allTextContents();
  expect(numbers).toEqual([...numbers].sort());
  await searchFor(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(cards(page)).toHaveCount(guidePaths.length);
});

test("waits for one accepted library request and searches every published article body", async ({ page }) => {
  const library = publishedLibrary();
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  const requestedKeys: string[] = [];
  await page.route("**/rest/v1/site_pages?*", async (route) => {
    requestedKeys.push(new URL(route.request().url()).searchParams.get("page_key")!);
    await ready;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(library.rows()) });
  });
  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  const input = inputFor(page);
  await expect(input).toBeDisabled();
  await expect(cards(page)).toHaveCount(guidePaths.length);
  release();
  await expect(input).toBeEnabled();
  expect(requestedKeys).toHaveLength(1);
  expect(new Set(requestedKeys[0].slice(4, -1).split(","))).toEqual(new Set(["__sitewide__", "/insights", ...guidePaths]));
  for (const [index, marker] of library.markers.entries()) {
    await input.fill(marker);
    await expect(titleLinks(page)).toHaveCount(1);
    await expect(titleLinks(page)).toHaveAttribute("href", guidePaths[index]);
    await expect(cards(page).locator(".insight-card-number")).toHaveText(String(index + 1).padStart(2, "0"));
  }
  expect(requestedKeys).toHaveLength(1);
});

test("respects owner-removed cards and replaces retired body text with accepted published edits", async ({ page }) => {
  const library = publishedLibrary();
  library.index.articles = library.index.articles.filter((card) => card.href !== inspectionPath);
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(library.rows()) }));
  const input = await openFinder(page);
  await expect(cards(page)).toHaveCount(guidePaths.length - 1);
  await expect(page.locator(`#guide-finder-results .insight-card h2 a[href="${inspectionPath}"]`)).toHaveCount(0);
  for (const query of [library.markers[3], "radon", "post-closing reserves"]) {
    await input.fill(query);
    await expect(cards(page)).toHaveCount(0);
    await expect(searchFor(page).getByRole("status")).toContainText("No guides found");
  }
  await input.fill(library.markers[0]);
  await expect(titleLinks(page)).toHaveCount(1);
  await expect(titleLinks(page)).toHaveAttribute("href", guidePaths[0]);
});

test("upgrades version-one libraries with the agent guide while retaining owner order, edits and removals", async ({ page }) => {
  const library = publishedLibrary(1);
  const legacyCards = structuredClone(insightIndex.articles.filter((card) => card.href !== agentGuidePath));
  [legacyCards[0], legacyCards[2]] = [legacyCards[2], legacyCards[0]];
  legacyCards[0].title = "Owner's reviewed property research guide";
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(library.rows()) }));
  for (const removeInspection of [false, true]) {
    library.index.articles = legacyCards.filter((card) => !removeInspection || card.href !== inspectionPath);
    const input = await openFinder(page);
    await input.fill("");
    const expectedPaths = [...library.index.articles.map((card) => card.href), agentGuidePath];
    await expect(cards(page)).toHaveCount(expectedPaths.length);
    expect(await titleLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(expectedPaths);
    await expect(titleLinks(page).first()).toHaveText(legacyCards[0].title);
    if (removeInspection) {
      await expect(page.locator(`#guide-finder-results .insight-card h2 a[href="${inspectionPath}"]`)).toHaveCount(0);
    }
    await input.fill(library.markers[guidePaths.indexOf(agentGuidePath)]);
    await expect(titleLinks(page)).toHaveCount(1);
    await expect(titleLinks(page)).toHaveAttribute("href", agentGuidePath);
  }
});

test("keeps queries local, preserves history state, and supports keyboard and Clear at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.setItem("site-theme", "dark");
    history.replaceState({ ...history.state, guideTestUnrelated: { retained: true } }, "");
  });
  let requests = 0;
  await page.route("**/rest/v1/site_pages?*", (route) => {
    requests += 1;
    return route.fulfill({ contentType: "application/json", body: "[]" });
  });
  const input = await openFinder(page);
  const entry = await page.evaluate(() => history.state.sjreScrollEntry);
  expect(typeof entry).toBe("string");
  const length = await page.evaluate(() => history.length);
  const transmissions: string[] = [];
  page.on("request", (request) => transmissions.push(`${request.url()} ${request.postData() || ""}`));
  await input.fill("radon");
  await input.press("Enter");
  await expect(titleLinks(page)).toBeFocused();
  await input.focus();
  await input.press("ArrowDown");
  await expect(titleLinks(page)).toBeFocused();
  await input.focus();
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(cards(page)).toHaveCount(guidePaths.length);
  const query = "SJRE private guide search fixture 27386";
  await input.fill(query);
  await expect(cards(page)).toHaveCount(0);
  await expect(searchFor(page).getByRole("status")).toContainText("No guides found");
  expect(await page.evaluate(() => history.state)).toMatchObject({
    sjreGuideFinderQuery: query, sjreScrollEntry: entry, guideTestUnrelated: { retained: true },
  });
  await expect(page).toHaveURL("/insights");
  expect(await page.evaluate(() => history.length)).toBe(length);
  expect(requests).toBe(1);
  expect(transmissions.some((transmission) => decodeURIComponent(transmission).includes(query))).toBe(false);
  expect(transmissions.filter((transmission) => /google-analytics|googletagmanager|doubleclick/i.test(transmission))).toEqual([]);
  expect(await page.evaluate((value) => [localStorage, sessionStorage].some((storage) => (
    Object.values(storage).some((stored) => typeof stored === "string" && stored.includes(value))
  )), query)).toBe(false);
  await searchFor(page).getByRole("button", { name: "Clear", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(cards(page)).toHaveCount(guidePaths.length);
});

for (const scenario of [
  { name: "desktop light", theme: "light", viewport: { width: 1440, height: 1000 } },
  { name: "mobile dark", theme: "dark", viewport: { width: 390, height: 844 } },
] as const) {
  test(`Back and Forward retain each guide search, result set and reading position on ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.addInitScript((theme) => localStorage.setItem("site-theme", theme), scenario.theme);
    const input = await openFinder(page);
    await input.fill("flood insurance");
    await expect.poll(() => cards(page).count()).toBeGreaterThan(1);
    const firstResults = await titleLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    const result = titleLinks(page).last();
    const path = (await result.getAttribute("href"))!;
    await result.scrollIntoViewIfNeeded();
    await settleLayout(page);
    const finderY = await readY(page);
    expect(finderY).toBeGreaterThan(200);
    await result.click();
    await expectArticle(page, path);
    await page.evaluate(() => window.scrollTo({ top: 1400, behavior: "instant" }));
    await settleLayout(page);
    const articleY = await readY(page);
    await page.goBack();
    await expect(page).toHaveURL("/insights");
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("flood insurance");
    expect(await titleLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(firstResults);
    await expectY(page, finderY);
    await page.goForward();
    await expectArticle(page, path);
    await expectY(page, articleY);

    await page.locator(".insight-back-link").click();
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("");
    await expect(cards(page)).toHaveCount(guidePaths.length);
    await input.fill("radon");
    await titleLinks(page).click();
    await expectArticle(page, inspectionPath);
    await page.goBack();
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("radon");
    await expect(titleLinks(page)).toHaveAttribute("href", inspectionPath);
    await page.goBack();
    await expectArticle(page, path);
    await page.goBack();
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("flood insurance");
    expect(await titleLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(firstResults);
    await expectY(page, finderY);
  });
}

async function openNatively(page: Page, link: Locator, method: "modified" | "middle") {
  await page.bringToFront();
  await link.scrollIntoViewIfNeeded();
  const originY = await readY(page);
  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    method === "middle" ? link.click({ button: "middle" }) : link.click({ modifiers: ["ControlOrMeta"] }),
  ]);
  try {
    await opened.bringToFront();
    await expectArticle(opened, inspectionPath);
    await expect(page).toHaveURL("/insights");
    await expect(inputFor(page)).toHaveValue("radon");
    await expect(titleLinks(page)).toHaveAttribute("href", inspectionPath);
    await expectY(page, originY);
  } finally {
    await opened.close();
    await page.bringToFront();
  }
}

test("modified and middle clicks open the original guide while leaving its search intact", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const input = await openFinder(page);
  await input.fill("radon");
  await expect(titleLinks(page)).toHaveAttribute("href", inspectionPath);
  await openNatively(page, titleLinks(page), "modified");
  await openNatively(page, cards(page).locator(".insight-read-link"), "middle");
  await expect(input).toHaveValue("radon");
  await expect(cards(page).locator(".insight-card-number")).toHaveText(inspectionNumber);
});
