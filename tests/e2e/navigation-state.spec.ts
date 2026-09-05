import { expect, test, type Page } from "@playwright/test";

async function deferPublishedContent(page: Page) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/rest/v1/site_pages?*", async (route) => {
    await released;
    await route.fulfill({ contentType: "application/json", body: "[]" });
  });
  return async () => {
    const response = page.waitForResponse((item) => item.url().includes("/rest/v1/site_pages?"));
    release();
    await response;
    // Allow the response's React update and its effects to finish.
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
  };
}

test("analytics consent preserves a shared town through content arrival and theme changes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("analytics-consent", "granted");
    localStorage.setItem("site-theme", "light");
  });
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  const release = await deferPublishedContent(page);
  await page.goto("/cape-may-county?email=test%40example.com#wildwood", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Collapse Wildwood details", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/cape-may-county#wildwood$/);
  await page.getByRole("button", { name: "Expand all", exact: true }).click();
  await release();
  await expect(page.getByRole("button", { name: "Collapse Wildwood Crest details", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.getByRole("button", { name: "Collapse Wildwood Crest details", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/cape-may-county#wildwood$/);
  const analytics = await page.evaluate(() => JSON.stringify(window.dataLayer));
  expect(analytics).not.toContain("test%40example.com");
  expect(analytics).not.toContain("#wildwood");
});

test("published content arriving after a visitor scrolls preserves the reading position", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("analytics-consent", "denied"));
  const release = await deferPublishedContent(page);
  await page.goto("/atlantic-county", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("#page h1")).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  const previousY = await page.evaluate(() => window.scrollY);
  await release();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(previousY - 20);
});
