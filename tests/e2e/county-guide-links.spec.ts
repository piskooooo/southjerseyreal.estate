import { expect, test, type Page } from "@playwright/test";

// Browser plugin not available; use the repository's configured Playwright browser.
const counties = [
  {
    path: "/camden-county",
    town: "Camden City",
    communityId: "camden-city",
    links: [
      { label: "Preparing to sell a New Jersey home", href: "/insights/preparing-to-sell-a-new-jersey-home", title: "Preparing to Sell a New Jersey Home" },
      { label: "Researching municipal records, permits, and zoning", href: "/insights/municipal-records-permits-and-zoning", title: "Using Municipal Records, Permits, and Zoning Information in a Home Search" },
    ],
  },
  {
    path: "/atlantic-county",
    town: "Atlantic City",
    communityId: "atlantic-city",
    links: [
      { label: "Coastal property due diligence for a shore home", href: "/insights/coastal-property-due-diligence", title: "Coastal-Property Due Diligence in South Jersey" },
    ],
  },
] as const;

async function preparePage(page: Page, consent: "granted" | "denied") {
  await page.addInitScript((value) => {
    localStorage.setItem("analytics-consent", value);
    localStorage.setItem("site-theme", "dark");
  }, consent);
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: "" }));
}

async function openCounty(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator(".county-intro")).toBeVisible();
}

async function analyticsEvents(page: Page, name: string) {
  return page.evaluate((eventName) => (window.dataLayer || [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "event" && entry[1] === eventName), name);
}

for (const county of counties) {
  test(`${county.path} exposes crawlable guide links and preserves discreet mobile styling and guidance CTAs`, async ({ browser, page, baseURL }) => {
    const noScript = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const initial = await noScript.newPage();
      const response = await initial.goto(county.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      const html = await response!.text();
      for (const link of county.links) {
        expect(html).toContain(`<a href="${link.href}">${link.label}</a>`);
        await expect(initial.getByRole("link", { name: link.label, exact: true })).toHaveAttribute("href", link.href);
      }
      await initial.getByRole("link", { name: county.links[0].label, exact: true }).click();
      await expect(initial).toHaveURL(county.links[0].href);
      await expect(initial.getByRole("heading", { name: county.links[0].title, level: 1, exact: true })).toBeVisible();
    } finally {
      await noScript.close();
    }

    await preparePage(page, "denied");
    await page.setViewportSize({ width: 320, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const link of county.links) {
      await openCounty(page, county.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const intro = page.locator(".county-intro");
      await expect(intro.locator("a.button")).toHaveCount(county.links.length);
      const contextual = intro.getByRole("link", { name: link.label, exact: true });
      await expect(contextual).toHaveAttribute("href", link.href);
      expect(await contextual.evaluate((element) => {
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return {
          background: style.backgroundColor,
          underlined: style.textDecorationLine.includes("underline"),
          fitsViewport: bounds.left >= -1 && bounds.right <= window.innerWidth + 1,
        };
      })).toEqual({ background: "rgba(0, 0, 0, 0)", underlined: true, fitsViewport: true });
      const guidance = page.locator(".county-support-section-guidance");
      await expect(guidance.locator("a.button")).toHaveCount(2);
      await expect(guidance.getByRole("link", { name: "Read Buyer and Seller Guides", exact: true })).toHaveAttribute("href", "/insights");
      await expect(guidance.getByRole("link", { name: "Contact Arthur", exact: true })).toHaveAttribute("href", "/contact");
      expect(await guidance.locator("a.button").evaluateAll((elements) => elements.every((element) => (
        getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)"
        && element.getBoundingClientRect().height >= 44
      )))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      await contextual.click();
      await expect(page).toHaveURL(link.href);
      await expect(page.getByRole("heading", { name: link.title, level: 1, exact: true })).toBeVisible();
      expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test(`${county.path} uses existing consented link analytics without town context or conversion events`, async ({ page }) => {
    await preparePage(page, "granted");
    await openCounty(page, county.path);
    await page.getByRole("button", { name: `Expand ${county.town} details`, exact: true }).click();
    const townEvents = await analyticsEvents(page, "community_profile_open");
    expect(townEvents).toEqual([
      ["event", "community_profile_open", expect.objectContaining({
        county_id: county.path.slice(1).replace(/-county$/, ""),
        community_id: county.communityId,
        open_method: "manual",
      })],
    ]);
    const link = county.links[0];
    await page.locator(".county-intro").getByRole("link", { name: link.label, exact: true }).click();
    await expect(page).toHaveURL(link.href);
    await expect(page.getByRole("heading", { name: link.title, level: 1, exact: true })).toBeVisible();
    const clicks = await analyticsEvents(page, "internal_link_click");
    expect(clicks).toEqual([
      ["event", "internal_link_click", expect.objectContaining({
        destination_type: "internal", link_url: link.href, link_source: "content_button",
      })],
    ]);
    expect(clicks[0][2]).not.toHaveProperty("county_id");
    expect(clicks[0][2]).not.toHaveProperty("community_id");
    expect(await analyticsEvents(page, "community_profile_open")).toEqual(townEvents);
    expect(await analyticsEvents(page, "page_view")).toHaveLength(2);
    for (const eventName of ["generate_lead", "contact_lead", "sign_up"]) {
      expect(await analyticsEvents(page, eventName)).toEqual([]);
    }
  });
}
