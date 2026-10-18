import { expect, test, type Locator, type Page } from "@playwright/test";

// Browser plugin not available; use the repository's bundled Playwright Chromium.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem("analytics-consent", "granted");
      localStorage.setItem("site-theme", "light");
    } catch {
      // New tabs can briefly have an opaque document before navigation.
    }
  });
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await context.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
  await context.route("https://*.google-analytics.com/**", (route) => route.fulfill({ body: "" }));
});

async function expectReady(page: Page) {
  await expect(page.locator("#page h1")).toBeVisible();
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
}

async function openRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expectReady(page);
  // This attribute survives SPA navigation and disappears on a document reload.
  await page.locator("html").evaluate((element) => { element.setAttribute("data-navigation-test", "same-document"); });
}

async function expectSameDocument(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-navigation-test", "same-document");
}

async function openNatively(
  page: Page,
  link: Locator,
  method: "modified" | "middle",
  inspect?: (opened: Page) => Promise<void>,
) {
  await page.bringToFront();
  await link.scrollIntoViewIfNeeded();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  const originUrl = page.url();
  const destination = new URL(href!, originUrl).href;
  const originScroll = await page.evaluate(() => window.scrollY);
  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    method === "middle" ? link.click({ button: "middle" }) : link.click({ modifiers: ["ControlOrMeta"] }),
  ]);
  try {
    await opened.bringToFront();
    // Check the destination UI rather than waiting on a popup lifecycle event.
    await expect(opened).toHaveURL(destination);
    await expectReady(opened);
    await expect(page).toHaveURL(originUrl);
    await expectSameDocument(page);
    expect(Math.abs(await page.evaluate(() => window.scrollY) - originScroll)).toBeLessThanOrEqual(2);
    await inspect?.(opened);
  } finally {
    await opened.close();
    await page.bringToFront();
  }
}

async function analyticsEvents(page: Page, name: string) {
  return page.evaluate((eventName) => (window.dataLayer || [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "event" && entry[1] === eventName), name);
}

test("desktop header native clicks preserve the reading page while ordinary clicks and Enter keep SPA navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openRoute(page, "/camden-county");
  await page.getByRole("button", { name: "Expand Cherry Hill details", exact: true }).click();
  await page.locator("#cherry-hill h3").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await openNatively(page, page.locator(".desktop-nav").getByRole("link", { name: "Counties", exact: true }), "modified");
  await expect(page.getByRole("button", { name: "Collapse Cherry Hill details", exact: true })).toBeVisible();

  await page.locator(".header-actions").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL("/contact");
  await expectReady(page);
  await expectSameDocument(page);
  await page.locator(".brand").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expectReady(page);
  await expectSameDocument(page);
});

test("mobile menu stays open for native modified and middle clicks and closes for ordinary keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, "/insights");
  await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  const menu = page.locator("#mobile-menu");
  const camden = menu.getByRole("link", { name: "Camden", exact: true });
  await openNatively(page, camden, "modified");
  await expect(page.getByRole("button", { name: "Close navigation menu", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();
  const clicks = await analyticsEvents(page, "internal_link_click");
  expect(clicks).toEqual([
    ["event", "internal_link_click", expect.objectContaining({ link_url: "/camden-county", link_source: "mobile_nav" })],
  ]);

  await openNatively(page, camden, "middle");
  await expect(menu).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation menu", exact: true })).toHaveAttribute("aria-expanded", "true");
  expect(await analyticsEvents(page, "internal_link_click")).toEqual(clicks);
  await camden.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/camden-county");
  await expectReady(page);
  await expectSameDocument(page);
  await expect(page.getByRole("button", { name: "Open navigation menu", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeHidden();
});

test("content, guide, footer and disclosure links retain their native destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openRoute(page, "/camden-county");
  await openNatively(page, page.locator(".county-intro").getByRole("link", { name: "Preparing to sell a New Jersey home", exact: true }), "modified");
  await openNatively(page, page.locator(".site-footer-links").getByRole("link", { name: "Contact", exact: true }), "middle");
  await openNatively(page, page.getByRole("complementary", { name: "Community information note" }).getByRole("link", { name: "Website disclosures", exact: true }), "modified");

  await openRoute(page, "/insights");
  const guide = page.locator(".insight-card h2 a").first();
  await openNatively(page, guide, "modified");
  const destination = await guide.getAttribute("href");
  await guide.click();
  await expect(page).toHaveURL(destination!);
  await expectReady(page);
  await expectSameDocument(page);
});

test("native town and article hash links preserve the origin menu and expand or focus only in the new tab", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, "/camden-county");
  const toolbar = page.locator(".town-grid-toolbar");
  await toolbar.evaluate((element) => window.scrollTo({
    top: element.getBoundingClientRect().top + window.scrollY + 180,
    behavior: "instant",
  }));
  await expect.poll(() => toolbar.evaluate((element) => Math.abs(
    element.getBoundingClientRect().top - document.querySelector(".site-header")!.getBoundingClientRect().bottom,
  ))).toBeLessThanOrEqual(1);
  const directory = page.locator(".town-directory");
  await directory.locator("summary").click();
  const town = directory.getByRole("link", { name: "Cherry Hill", exact: true });
  await openNatively(page, town, "modified", async (opened) => {
    await expect(opened.getByRole("button", { name: "Collapse Cherry Hill details", exact: true })).toBeVisible();
    await expect(opened.locator("#cherry-hill")).toBeFocused();
  });
  await expect(directory).toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: "Expand Cherry Hill details", exact: true })).toBeVisible();
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([]);
  await town.click();
  await expect(page).toHaveURL("/camden-county#cherry-hill");
  await expect(directory).not.toHaveAttribute("open", "");
  await expect(page.locator("#cherry-hill")).toBeFocused();
  await expectSameDocument(page);

  await openRoute(page, "/insights/new-jersey-homebuying-process");
  const contents = page.locator(".insight-contents-dropdown");
  await contents.locator("summary").click();
  const sectionLink = contents.getByRole("link").nth(1);
  const hash = await sectionLink.getAttribute("href");
  await openNatively(page, sectionLink, "modified", async (opened) => {
    await expect(opened.locator(hash!)).toBeFocused();
  });
  await expect(contents).toHaveAttribute("open", "");
  expect(await analyticsEvents(page, "internal_link_click")).toEqual([]);
  await sectionLink.click();
  await expect(page).toHaveURL(`/insights/new-jersey-homebuying-process${hash}`);
  await expect(contents).not.toHaveAttribute("open", "");
  await expect(page.locator(hash!)).toBeFocused();
  await expectSameDocument(page);
});
