import { expect, test, type Page } from "@playwright/test";
import { insightIndex } from "../../src/content/insights";

// Browser plugin not available; use the repository's configured Playwright browser.
const observations = new WeakMap<Page, { errors: string[]; submissions: string[] }>();
const scenarios = [
  { name: "desktop light", theme: "light", viewport: { width: 1440, height: 1000 } },
  { name: "mobile dark", theme: "dark", viewport: { width: 390, height: 844 } },
] as const;

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem("analytics-consent", "denied");
    } catch {
      // Native new documents can briefly have an opaque origin.
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
});

async function settleLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function expectReady(page: Page) {
  await expect(page.locator("#page h1")).toBeVisible();
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await settleLayout(page);
}

const readY = (page: Page) => page.evaluate(() => window.scrollY);

async function expectY(page: Page, expected: number) {
  await expect.poll(async () => Math.abs(await readY(page) - expected)).toBeLessThanOrEqual(2);
}

async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await settleLayout(page);
  return readY(page);
}

async function openLastGuide(page: Page) {
  const link = page.locator(".insight-card h2 a").last();
  await link.scrollIntoViewIfNeeded();
  await settleLayout(page);
  const indexY = await readY(page);
  expect(indexY).toBeGreaterThan(500);
  const href = (await link.getAttribute("href"))!;
  await link.click();
  await expect(page).toHaveURL(href);
  await expectReady(page);
  await expectY(page, 0);
  return { href, indexY };
}

for (const scenario of scenarios) {
  test(`Back and Forward restore the guide list and article reading positions on ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.addInitScript((theme) => {
      try { localStorage.setItem("site-theme", theme); } catch { /* Opaque initial document. */ }
    }, scenario.theme);
    await page.goto("/insights", { waitUntil: "domcontentloaded" });
    await expectReady(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", scenario.theme);
    const historyLength = await page.evaluate(() => history.length);
    const { href, indexY } = await openLastGuide(page);
    const articleY = await scrollTo(page, 1400);
    expect(articleY).toBeGreaterThan(1000);
    expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);

    await page.goBack();
    await expect(page).toHaveURL("/insights");
    await expectReady(page);
    await expectY(page, indexY);
    await page.goForward();
    await expect(page).toHaveURL(href);
    await expectReady(page);
    await expectY(page, articleY);
  });

  test(`town-finder search and town reading positions survive history traversal on ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.addInitScript((theme) => {
      try { localStorage.setItem("site-theme", theme); } catch { /* Opaque initial document. */ }
    }, scenario.theme);
    await page.goto("/counties", { waitUntil: "domcontentloaded" });
    await expectReady(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", scenario.theme);
    const input = page.getByRole("searchbox", { name: "Find a town", exact: true });
    await expect(input).toBeEnabled();
    await input.fill("Washington");
    const destination = "/gloucester-county#washington-township";
    const townLink = page.locator(`.town-finder-results a[href="${destination}"]`);
    await scrollTo(page, 350);
    await townLink.scrollIntoViewIfNeeded();
    await settleLayout(page);
    const finderY = await readY(page);
    await townLink.click();
    await expect(page).toHaveURL(destination);
    await expect(page.locator("#washington-township")).toBeFocused();
    await expect(page.getByRole("button", { name: "Collapse Washington Township details", exact: true })).toBeVisible();
    await settleLayout(page);
    const townY = await scrollTo(page, await readY(page) + 180);

    await page.goBack();
    await expect(page).toHaveURL("/counties");
    await expect(input).toHaveValue("Washington");
    await expect(input).toBeEnabled();
    await expectY(page, finderY);
    await page.goForward();
    await expect(page).toHaveURL(destination);
    await expect(page.getByRole("button", { name: "Collapse Washington Township details", exact: true })).toBeVisible();
    await expectY(page, townY);

    // Assistive technology can activate a link without pointer or keyboard events.
    await scrollTo(page, await readY(page) + 300);
    await page.locator(".town-directory").evaluate((element) => { (element as HTMLDetailsElement).open = true; });
    await page.locator('.town-directory a[href="#washington-township"]').evaluate((element) => (element as HTMLAnchorElement).click());
    await expect(page.locator("#washington-township")).toBeFocused();
    await expect.poll(() => page.locator("#washington-township").evaluate((element) => Math.abs(
      element.getBoundingClientRect().top - parseFloat(getComputedStyle(element).scrollMarginTop),
    ))).toBeLessThanOrEqual(2);
  });
}

test("Back restores expanded county profiles before restoring their previous reading position", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/camden-county", { waitUntil: "domcontentloaded" });
  await expectReady(page);
  await page.getByRole("button", { name: "Expand all", exact: true }).click();
  const expandedProfiles = page.getByRole("button", { name: /^Collapse .+ details$/ });
  await expect(expandedProfiles).toHaveCount(34);
  const marker = page.locator("#haddonfield");
  await marker.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
  const countyY = await scrollTo(page, await readY(page) + 260);
  const markerTop = await marker.evaluate((element) => element.getBoundingClientRect().top);
  await page.locator(".header-actions").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL("/contact");
  await expectReady(page);
  await expectY(page, 0);

  await page.goBack();
  await expect(page).toHaveURL("/camden-county");
  await expect(expandedProfiles).toHaveCount(34);
  await expectY(page, countyY);
  await expect.poll(async () => Math.abs(
    await marker.evaluate((element) => element.getBoundingClientRect().top) - markerTop,
  )).toBeLessThanOrEqual(2);
  await page.goForward();
  await expect(page).toHaveURL("/contact");
  await expectReady(page);
  await expectY(page, 0);
});

test("Back restores open FAQ and comparison panels before restoring the reading position", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ["/faq", "/why-south-jersey"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expectReady(page);
    const panels = page.locator("details.guide-panel");
    const panelCount = await panels.count();
    expect(panelCount).toBeGreaterThan(1);
    for (let index = 0; index < panelCount; index += 1) {
      await panels.nth(index).locator("summary").click();
    }
    await expect(page.locator("details.guide-panel[open]")).toHaveCount(panelCount);
    const marker = panels.nth(Math.floor(panelCount / 2)).locator(".guide-panel-content");
    await marker.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
    const previousY = await scrollTo(page, await readY(page) + 130);
    const markerTop = await marker.evaluate((element) => element.getBoundingClientRect().top);
    await page.locator(".header-actions").getByRole("link", { name: "Contact", exact: true })
      .evaluate((element) => (element as HTMLAnchorElement).click());
    await expect(page).toHaveURL("/contact");
    await expectReady(page);
    await expectY(page, 0);

    await page.goBack();
    await expect(page).toHaveURL(path);
    await expect(page.locator("details.guide-panel[open]")).toHaveCount(panelCount);
    await expectY(page, previousY);
    await expect.poll(async () => Math.abs(
      await marker.evaluate((element) => element.getBoundingClientRect().top) - markerTop,
    )).toBeLessThanOrEqual(2);
    await page.goForward();
    await expect(page).toHaveURL("/contact");
    await expectReady(page);
    await expectY(page, 0);
  }
});

test("separate visits to the same route keep separate positions and fresh links still start at the top", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  await expectReady(page);
  const { href, indexY: firstIndexY } = await openLastGuide(page);
  await page.locator(".insight-back-link").click();
  await expect(page).toHaveURL("/insights");
  await expectReady(page);
  await expectY(page, 0);
  const secondIndexY = await scrollTo(page, 650);
  expect(Math.abs(firstIndexY - secondIndexY)).toBeGreaterThan(300);
  await page.locator(".brand").click();
  await expect(page).toHaveURL("/");
  await expectReady(page);
  await expectY(page, 0);

  await page.goBack();
  await expect(page).toHaveURL("/insights");
  await expectReady(page);
  await expectY(page, secondIndexY);
  await page.goBack();
  await expect(page).toHaveURL(href);
  await expectReady(page);
  await expectY(page, 0);
  await page.goBack();
  await expect(page).toHaveURL("/insights");
  await expectReady(page);
  await expectY(page, firstIndexY);
});

test("native article section history restores reading below an anchor rather than jumping back to its heading", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const articlePath = "/insights/new-jersey-homebuying-process";
  await page.goto(articlePath, { waitUntil: "domcontentloaded" });
  await expectReady(page);
  const links = page.locator(".insight-contents-desktop a");
  const first = links.nth(1);
  const firstHash = (await first.getAttribute("href"))!;
  await first.click();
  await expect(page).toHaveURL(`${articlePath}${firstHash}`);
  await expect(page.locator(firstHash)).toBeFocused();
  await settleLayout(page);
  await scrollTo(page, await readY(page) + 180);
  const second = links.nth(3);
  await second.scrollIntoViewIfNeeded();
  await settleLayout(page);
  const firstY = await readY(page);
  const secondHash = (await second.getAttribute("href"))!;
  await second.click();
  await expect(page).toHaveURL(`${articlePath}${secondHash}`);
  await expect(page.locator(secondHash)).toBeFocused();
  await settleLayout(page);
  const secondY = await scrollTo(page, await readY(page) + 160);

  await page.goBack();
  await expect(page).toHaveURL(`${articlePath}${firstHash}`);
  await expectY(page, firstY);
  await page.goForward();
  await expect(page).toHaveURL(`${articlePath}${secondHash}`);
  await expectY(page, secondY);
});

test("restoration waits for accepted content and a later navigation cancels an outstanding restoration", async ({ context, page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const introduction = "Published guidance for carefully researching property and planning the next step. ".repeat(85).trim();
  const publishedIndex = [{
    page_key: "/insights",
    published_at: "2026-10-19T12:00:00Z",
    published_content: { insightIndex: { ...insightIndex, introduction } },
  }];
  const gates = [1, 2].map(() => {
    let release!: () => void;
    let entered!: () => void;
    return {
      entered: new Promise<void>((resolve) => { entered = resolve; }),
      released: new Promise<void>((resolve) => { release = resolve; }),
      markEntered: () => entered(),
      release: () => release(),
    };
  });
  let indexRequests = 0;
  await context.route("**/rest/v1/site_pages?*", async (route) => {
    const requested = new URL(route.request().url()).searchParams.get("page_key") || "";
    const isIndex = requested.endsWith(",/insights)");
    if (isIndex) {
      const gate = gates[indexRequests - 1];
      indexRequests += 1;
      if (gate) {
        gate.markEntered();
        await gate.released;
      }
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(isIndex ? publishedIndex : []) });
  });
  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".insights-index-hero > p:last-child")).toHaveText(introduction);
  await expectReady(page);
  const { href, indexY } = await openLastGuide(page);

  await page.goBack();
  await gates[0].entered;
  await expect(page).toHaveURL("/insights");
  await expect(page.locator(".insights-index-hero > p:last-child")).toHaveText(insightIndex.introduction);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThan(indexY - 50);
  gates[0].release();
  await expect(page.locator(".insights-index-hero > p:last-child")).toHaveText(introduction);
  await expectY(page, indexY);

  await page.goForward();
  await expect(page).toHaveURL(href);
  await expectReady(page);
  await page.goBack();
  await gates[1].entered;
  await expect(page).toHaveURL("/insights");
  await page.locator(".brand").click();
  await expect(page).toHaveURL("/");
  await expectReady(page);
  await expectY(page, 0);
  const delayedResponse = page.waitForResponse((response) => {
    const requested = new URL(response.url()).searchParams.get("page_key") || "";
    return requested.endsWith(",/insights)");
  });
  gates[1].release();
  await delayedResponse;
  await settleLayout(page);
  await expect(page).toHaveURL("/");
  await expectY(page, 0);
});
