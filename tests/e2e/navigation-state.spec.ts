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

async function analyticsEvents(page: Page, name: string) {
  return page.evaluate((eventName) => (window.dataLayer || [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "event" && entry[1] === eventName), name);
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
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([
    ["event", "community_profile_open", expect.objectContaining({
      county_id: "cape-may", community_id: "wildwood", open_method: "anchor",
    })],
  ]);
});

test("all county guides record controlled town IDs and carry the last town to Contact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("analytics-consent", "granted"));
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));

  for (const [county, town, community] of [
    ["atlantic", "Atlantic City", "atlantic-city"],
    ["burlington", "Burlington City", "burlington-city"],
    ["camden", "Camden City", "camden-city"],
    ["cape-may", "Wildwood", "wildwood"],
    ["cumberland", "Bridgeton", "bridgeton"],
    ["gloucester", "Woodbury", "woodbury"],
    ["salem", "Salem City", "salem-city"],
  ]) {
    await page.goto(`/${county}-county`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: `Expand ${town} details`, exact: true }).click();
    const expected = [["event", "community_profile_open", expect.objectContaining({
      county_id: county, community_id: community, open_method: "manual",
    })]];
    expect(await analyticsEvents(page, "community_profile_open")).toEqual(expected);
    await page.getByRole("button", { name: `Collapse ${town} details`, exact: true }).click();
    await page.getByRole("button", { name: `Expand ${town} details`, exact: true }).click();
    expect(await analyticsEvents(page, "community_profile_open")).toEqual(expected);
  }

  await page.locator(".site-footer").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  expect(await analyticsEvents(page, "internal_link_click")).toEqual(expect.arrayContaining([
    ["event", "internal_link_click", expect.objectContaining({
      link_url: "/contact", county_id: "salem", community_id: "salem-city",
    })],
  ]));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("accepting analytics does not replay a town opened before consent", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.goto("/camden-county#camden-city", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Collapse Camden City details", exact: true })).toBeVisible();
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([]);
  await page.getByRole("button", { name: "Accept Analytics", exact: true }).click();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([]);
  await page.getByRole("button", { name: "Collapse Camden City details", exact: true }).click();
  await page.getByRole("button", { name: "Expand Camden City details", exact: true }).click();
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([
    ["event", "community_profile_open", expect.objectContaining({
      county_id: "camden", community_id: "camden-city", open_method: "manual",
    })],
  ]);
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
