import { expect, test, type Page } from "@playwright/test";
import { insightArticles, type InsightArticleContent } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const buyerPath = "/insights/new-jersey-homebuying-process";
const sellerPath = "/insights/preparing-to-sell-a-new-jersey-home";
const agentPath = "/insights/working-with-a-real-estate-agent-in-new-jersey";
const agentLabel = "Working with a real estate agent";
type RelatedLink = InsightArticleContent["relatedLinks"][number];
const observations = new WeakMap<Page, { errors: string[]; submissions: string[] }>();

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    try { localStorage.setItem("analytics-consent", "denied"); } catch { /* Opaque initial document. */ }
  });
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const record = { errors: [] as string[], submissions: [] as string[] };
  observations.set(page, record);
  page.on("pageerror", (error) => record.errors.push(error.message));
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
    record.submissions.push(route.request().url());
    return route.abort();
  });
});

test.afterEach(async ({ page }) => {
  expect(observations.get(page)!.errors).toEqual([]);
  expect(observations.get(page)!.submissions).toEqual([]);
});

function publishedArticle(path: string, article: InsightArticleContent, version?: number) {
  return {
    page_key: path,
    published_at: "2026-10-19T12:00:00Z",
    published_content: {
      insightArticle: article,
      insightContactLinksVersion: 1,
      ...(version === undefined ? {} : { insightAgentGuideLinksVersion: version }),
    },
  };
}

async function openArticle(page: Page, path: string, title: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("#page h1")).toHaveText(title);
}

async function expectRelated(page: Page, links: RelatedLink[]) {
  const related = page.locator(".insight-related-links");
  await expect(related.getByRole("link")).toHaveCount(links.length);
  await expect.poll(() => related.getByRole("link").evaluateAll((elements) => elements.map((element) => ({
    label: element.textContent, href: element.getAttribute("href"),
  })))).toEqual(links);
}

async function settleLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

test("older published buyer and seller guides retain custom content and expose a working agent-guide next step in HTML and the app", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const documents = [buyerPath, sellerPath].map((path, index) => {
    const article = structuredClone(insightArticles[path]);
    article.title = `Owner's reviewed ${index === 0 ? "buyer" : "seller"} guide`;
    article.sections[0].paragraphs[0] = `The owner's published ${index === 0 ? "buyer" : "seller"} introduction remains unchanged.`;
    article.relatedLinks = [
      { href: "/counties", label: `Owner-selected ${index === 0 ? "buyer" : "seller"} county research` },
      { href: "/contact", label: `Owner's ${index === 0 ? "buyer" : "seller"} contact step` },
      { href: "/about", label: `Owner-selected ${index === 0 ? "buyer" : "seller"} background` },
    ];
    return { path, article };
  });
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
    contentType: "application/json", body: JSON.stringify(documents.map(({ path, article }) => publishedArticle(path, article))),
  }));

  for (const { path, article } of documents) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const initialRelated = html.match(/<section[^>]*class="[^"]*\binsight-related-section\b[^"]*"[\s\S]*?<\/section>/)?.[0] || "";
    expect(initialRelated).toContain(`href="${agentPath}"`);
    expect(initialRelated).toContain(`>${agentLabel}</a>`);

    await openArticle(page, path, article.title);
    await expect(page.locator(".insight-article-body > section").first().locator(":scope > p:not(.insight-section-number)").first())
      .toHaveText(article.sections[0].paragraphs[0]);
    const expected = [article.relatedLinks[0], { href: agentPath, label: agentLabel }, ...article.relatedLinks.slice(1)];
    await expectRelated(page, expected);
    const link = page.locator(".insight-related-links").getByRole("link", { name: agentLabel, exact: true });
    await expect(link).toHaveClass(/\bbutton\b/);
    await link.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await settleLayout(page);
    const previousY = await page.evaluate(() => scrollY);
    await link.click();
    await expect(page).toHaveURL(agentPath);
    await expect(page.locator("#page h1")).toHaveText(insightArticles[agentPath].title);
    await page.goBack();
    await expect(page).toHaveURL(path);
    await expect(page.locator("#page h1")).toHaveText(article.title);
    await expectRelated(page, expected);
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - previousY)).toBeLessThanOrEqual(2);
  }
});

test("current-version removals and existing customized canonical agent links remain untouched", async ({ page }) => {
  const buyer = structuredClone(insightArticles[buyerPath]);
  buyer.relatedLinks = [
    { href: "/counties", label: "Owner's retained county step" },
    { href: "/contact", label: "Owner's retained contact step" },
  ];
  const seller = structuredClone(insightArticles[sellerPath]);
  const customizedHref = `https://southjerseyreal.estate${agentPath}/?from=owner#know-who-represents-whom`;
  seller.relatedLinks = [
    { href: "/about", label: "Owner's first selected next step" },
    { href: customizedHref, label: "Owner's customized representation guide" },
    { href: "/contact", label: "Owner's final selected next step" },
  ];
  const rows = [publishedArticle(buyerPath, buyer, 1), publishedArticle(sellerPath, seller)];
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(rows) }));

  await openArticle(page, buyerPath, buyer.title);
  await expectRelated(page, buyer.relatedLinks);
  await expect(page.locator(`.insight-related-links a[href*="${agentPath}"]`)).toHaveCount(0);
  await openArticle(page, sellerPath, seller.title);
  await expectRelated(page, seller.relatedLinks);
  const existing = page.locator(`.insight-related-links a[href*="${agentPath}"]`);
  await expect(existing).toHaveCount(1);
  await expect(existing).toHaveAttribute("href", customizedHref);
  await expect(existing).toHaveText("Owner's customized representation guide");
  await expect(page.locator(".insight-related-links").getByRole("link", { name: agentLabel, exact: true })).toHaveCount(0);
});
