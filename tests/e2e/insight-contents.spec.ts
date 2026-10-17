import { expect, test, type Locator, type Page } from "@playwright/test";
import { insightArticles } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const articlePath = "/insights/new-jersey-homebuying-process";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("analytics-consent", "denied"));
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
    contentType: "application/json", body: "[]",
  }));
});

async function openArticle(page: Page, path = articlePath) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("#page h1")).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(navigation).toBeVisible();
  return navigation;
}

async function pinContents(page: Page, navigation: Locator) {
  await navigation.evaluate((element) => window.scrollTo({
    top: element.getBoundingClientRect().top + window.scrollY + 180,
    behavior: "instant",
  }));
  await expect.poll(() => navigation.evaluate((element) => {
    const header = document.querySelector(".site-header")!;
    return Math.abs(element.getBoundingClientRect().top - header.getBoundingClientRect().bottom);
  })).toBeLessThanOrEqual(1);
}

async function expectHeadingClear(page: Page, hash: string) {
  await expect.poll(() => page.locator(`${hash} > h2`).evaluate((heading) => {
    const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    const contentsBottom = document.querySelector(".insight-table-of-contents")!.getBoundingClientRect().bottom;
    const top = heading.getBoundingClientRect().top;
    return top >= Math.max(headerBottom, contentsBottom) - 1 && top < window.innerHeight;
  })).toBe(true);
}

async function expectMenuContained(page: Page, menu: Locator) {
  await expect.poll(() => menu.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    return bounds.left >= -1 && bounds.right <= window.innerWidth + 1
      && bounds.height > 0 && bounds.top >= headerBottom - 1 && bounds.bottom <= window.innerHeight + 1;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

test("all eight articles retain native section links and the full desktop contents list", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect(Object.keys(insightArticles)).toHaveLength(8);
  for (const [path, article] of Object.entries(insightArticles)) {
    const navigation = await openArticle(page, path);
    const desktop = navigation.locator(".insight-contents-desktop");
    await expect(desktop).toBeVisible();
    await expect(navigation.locator(".insight-contents-dropdown")).toBeHidden();
    await expect(desktop.getByRole("link")).toHaveText(article.sections.map((section) => section.heading));
    const destinations = await page.locator(".insight-article-body > section:not(.insight-sources)").evaluateAll(
      (sections) => sections.map((section) => `#${section.id}`),
    );
    expect(await desktop.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href"))))
      .toEqual(destinations);
  }
  const navigation = page.getByRole("navigation", { name: "On this page", exact: true });
  expect(await navigation.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
  await navigation.evaluate((element) => window.scrollTo({
    top: element.getBoundingClientRect().top + window.scrollY + 180,
    behavior: "instant",
  }));
  const pinnedTop = await navigation.evaluate((element) => element.getBoundingClientRect().top);
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: "instant" }));
  await expect.poll(() => navigation.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(pinnedTop, 0);
  await expect(navigation.locator(".insight-contents-desktop")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const { width, theme } of [{ width: 320, theme: "light" }, { width: 390, theme: "dark" }] as const) {
  test(`mobile contents stays compact, clears headings and preserves history at ${width}px in ${theme}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("site-theme", value), theme);
    await page.setViewportSize({ width, height: 844 });
    const navigation = await openArticle(page, `${articlePath}?source=contents-fixture`);
    const dropdown = navigation.locator(".insight-contents-dropdown");
    const summary = dropdown.locator("summary");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(dropdown).toBeVisible();
    await expect(dropdown).not.toHaveAttribute("open", "");
    await expect(dropdown.locator("ol")).toBeHidden();
    await expect(navigation.locator(".insight-contents-desktop")).toBeHidden();
    expect(await navigation.evaluate((element) => (
      element.getBoundingClientRect().top > document.querySelector(".site-header")!.getBoundingClientRect().bottom + 1
    ))).toBe(true);

    await navigation.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      window.scrollTo({ top: bounds.bottom + window.scrollY - window.innerHeight + 48, behavior: "instant" });
    });
    await summary.click();
    await expect(dropdown).toHaveAttribute("open", "");
    await expectMenuContained(page, dropdown.locator("ol"));
    expect(await navigation.evaluate((element) => (
      element.getBoundingClientRect().top > document.querySelector(".site-header")!.getBoundingClientRect().bottom + 1
    ))).toBe(true);
    await summary.click();

    await pinContents(page, navigation);
    await summary.click();
    await expect(dropdown).toHaveAttribute("open", "");
    await expectMenuContained(page, dropdown.locator("ol"));
    const links = dropdown.getByRole("link");
    const firstHash = await links.nth(1).getAttribute("href");
    await links.nth(1).click();
    await expect(dropdown).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(`${articlePath}?source=contents-fixture${firstHash}`);
    await expect(page.locator(firstHash!)).toBeFocused();
    await expectHeadingClear(page, firstHash!);

    await summary.click();
    const secondHash = await links.nth(2).getAttribute("href");
    await links.nth(2).click();
    await expect(dropdown).not.toHaveAttribute("open", "");
    await expectHeadingClear(page, secondHash!);
    await page.goBack();
    await expect(page).toHaveURL(`${articlePath}?source=contents-fixture${firstHash}`);
    await expectHeadingClear(page, firstHash!);
    await page.goForward();
    await expect(page).toHaveURL(`${articlePath}?source=contents-fixture${secondHash}`);
    await expectHeadingClear(page, secondHash!);

    await page.locator(".insight-article-layout").evaluate((layout) => {
      const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
      window.scrollTo({ top: layout.getBoundingClientRect().bottom + window.scrollY - headerBottom + 32, behavior: "instant" });
    });
    await expect.poll(() => navigation.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const layoutBottom = element.closest(".insight-article-layout")!.getBoundingClientRect().bottom;
      const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
      return bounds.bottom <= layoutBottom + 1 && bounds.top < headerBottom - 1;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
  });
}

test("mobile contents supports keyboard dismissal and recalculates offsets after header wrapping", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const navigation = await openArticle(page);
  const dropdown = navigation.locator(".insight-contents-dropdown");
  const summary = dropdown.locator("summary");
  await pinContents(page, navigation);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(dropdown).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  const firstLink = dropdown.getByRole("link").first();
  await expect(firstLink).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dropdown).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(dropdown).toHaveAttribute("open", "");
  await page.locator(".insight-back-link").focus();
  await expect(dropdown).not.toHaveAttribute("open", "");
  await pinContents(page, navigation);
  await summary.click();
  await expect(dropdown).toHaveAttribute("open", "");
  await page.locator(".insight-article-hero h1").click();
  await expect(dropdown).not.toHaveAttribute("open", "");

  await pinContents(page, navigation);
  await summary.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(dropdown).toBeHidden();
  await expect(dropdown).not.toHaveAttribute("open", "");
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(dropdown).toBeVisible();
  await expect(dropdown).not.toHaveAttribute("open", "");
  await pinContents(page, navigation);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expectMenuContained(page, dropdown.locator("ol"));
  await page.keyboard.press("Tab");
  await expect(firstLink).toBeFocused();
  const hash = await firstLink.getAttribute("href");
  await page.keyboard.press("Enter");
  await expect(dropdown).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(`${articlePath}${hash}`);
  await expect(page.locator(hash!)).toBeFocused();
  await expectHeadingClear(page, hash!);
});
