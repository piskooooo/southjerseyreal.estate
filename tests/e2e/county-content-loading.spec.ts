import { expect, test, type Page, type Route } from "@playwright/test";

// Browser plugin not available; use the repository's configured Playwright browser.
const countyChunk = /\/assets\/countySiteContent-[^/?]+\.js(?:\?[^#]*)?$/;

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("analytics-consent", "denied");
    localStorage.setItem("site-theme", "light");
  });
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const submissions: string[] = [];
  await page.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)(?:\?|$)/, (route) => {
    submissions.push(route.request().url());
    return route.abort();
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return { errors, submissions };
}

async function holdCountyChunk(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let requestedUrl = "";
  const handler = async (route: Route) => {
    requestedUrl = route.request().url();
    await gate;
    await route.continue();
  };
  // Match the URL rather than the initiator: a modulepreload must be held too.
  await page.route(countyChunk, handler);
  return {
    requested: () => requestedUrl,
    release,
    async complete() {
      const responseReady = page.waitForResponse((response) => countyChunk.test(response.url()));
      release();
      const response = await responseReady;
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toMatch(/javascript/);
      expect(await response.finished()).toBeNull();
      // Await actual module evaluation, so a late navigation cannot evade the assertions.
      await page.evaluate(async (url) => { await import(url); }, requestedUrl);
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    },
    async dispose() {
      release();
      await page.unroute(countyChunk, handler);
    },
  };
}

test("keeps county HTML and its town anchor while the cold county module is pending", async ({ page }) => {
  const { errors, submissions } = await preparePage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const chunk = await holdCountyChunk(page);
  try {
    await page.goto("/camden-county#haddonfield", { waitUntil: "domcontentloaded" });
    await expect.poll(chunk.requested).not.toBe("");
    const preload = page.locator("link#county-content-preload");
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute("rel", "modulepreload");
    const preloadHref = await preload.getAttribute("href");
    expect(preloadHref).toMatch(countyChunk);
    expect(new URL(chunk.requested()).pathname).toBe(preloadHref);
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(1);
    await expect(page.locator("#page h1")).toContainText("Camden County");
    await expect(page.locator("#page").getByRole("heading", { name: "Haddonfield", exact: true })).toBeVisible();
    await expect(page).toHaveURL("/camden-county#haddonfield");
    await expect(page).toHaveTitle(/Camden County/);
    const initialText = await page.locator("#page").innerText();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(await page.locator("#page").innerText()).toBe(initialText);
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(1);

    await chunk.complete();
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
    await expect(page.locator("#page h1")).toContainText("Camden County");
    await expect(page).toHaveURL("/camden-county#haddonfield");
    const town = page.locator("article#haddonfield");
    await expect(town.getByRole("button", { name: "Collapse Haddonfield details", exact: true })).toBeVisible();
    await expect(town).toBeFocused();
    expect(errors).toEqual([]);
    expect(submissions).toEqual([]);
    expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
  } finally {
    await chunk.dispose();
  }
});

test("does not commit a prepared county route after newer navigation or Back", async ({ page }) => {
  const { errors, submissions } = await preparePage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Each document has a fresh module map, so both cases exercise a cold import.
  for (const destination of ["newer navigation", "Back"] as const) {
    await test.step(destination, async () => {
      const chunk = await holdCountyChunk(page);
      try {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
        await expect(page.locator("link#county-content-preload")).toHaveCount(0);
        const homeHeading = await page.locator("#page h1").innerText();
        await page.locator(".site-footer").getByRole("link", { name: "Insights", exact: true }).click();
        await expect(page).toHaveURL("/insights");
        await expect(page.getByRole("searchbox", { name: "Find a guide", exact: true })).toBeEnabled();
        await page.evaluate(() => { document.documentElement.dataset.countyRaceDocument = "same"; });
        await page.locator(".site-footer").getByRole("link", { name: "Counties", exact: true }).click();
        await expect.poll(chunk.requested).not.toBe("");
        await expect(page).toHaveURL("/insights");
        await expect(page.getByRole("searchbox", { name: "Find a guide", exact: true })).toBeEnabled();

        if (destination === "Back") await page.goBack();
        else await page.locator(".site-header .brand").click();
        await expect(page).toHaveURL("/");
        await expect(page.locator("#page h1")).toHaveText(homeHeading);
        await chunk.complete();
        await expect(page).toHaveURL("/");
        await expect(page.locator("#page h1")).toHaveText(homeHeading);
        await expect(page.locator("html")).toHaveAttribute("data-county-race-document", "same");
        await expect(page.locator(".town-finder")).toHaveCount(0);
        await expect(page.locator("link#county-content-preload")).toHaveCount(0);
      } finally {
        await chunk.dispose();
      }
    });
  }

  await page.goto("/insights/coastal-property-due-diligence", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator(".insight-print-action")).toBeVisible();
  await expect(page.locator("link#county-content-preload")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(submissions).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
});
