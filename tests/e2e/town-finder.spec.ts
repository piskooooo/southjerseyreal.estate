import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Browser plugin not available; use the repository's configured Playwright browser.
const profiles = JSON.parse(readFileSync(new URL("../../src/content/communityProfiles.json", import.meta.url), "utf8")) as {
  counties: Record<string, {
    name: string;
    communities: Array<{ title: string; summary: string; sources: Array<{ title: string; href: string; accessed: string }> }>;
  }>;
};
const legacy = JSON.parse(readFileSync(new URL("../../src/content/legacyCommunitySummaries.json", import.meta.url), "utf8")) as {
  counties: Record<string, Array<{ id: string }>>;
};

async function preparePage(page: Page, theme: "light" | "dark" = "light") {
  await page.addInitScript((value) => {
    localStorage.setItem("analytics-consent", "denied");
    localStorage.setItem("site-theme", value);
  }, theme);
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({
    contentType: "application/javascript", body: "",
  }));
}

async function openFinder(page: Page) {
  await page.goto("/counties", { waitUntil: "networkidle" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  const input = page.getByRole("searchbox", { name: "Find a town", exact: true });
  await expect(input).toBeEnabled();
  return input;
}

async function expectOpenedTown(page: Page, destination: string, title: string) {
  await expect(page).toHaveURL(destination);
  const profile = page.locator(`article${destination.slice(destination.indexOf("#"))}`);
  await expect(profile.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(profile.locator(".town-card-details")).toBeVisible();
  await expect(profile.getByRole("button", { name: `Collapse ${title} details`, exact: true })).toBeVisible();
  await expect(profile).toBeFocused();
}

test("finds towns across county boundaries and opens their existing profiles", async ({ page }) => {
  await preparePage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const town of [
    { query: "Merchantville", title: "Merchantville", county: "Camden County", href: "/camden-county#merchantville" },
    { query: "Bass River", title: "Bass River Township", county: "Burlington County", href: "/burlington-county#bass-river-township" },
  ]) {
    const input = await openFinder(page);
    await input.fill(town.query);
    const results = page.getByRole("list", { name: "Matching towns", exact: true });
    const link = results.getByRole("link");
    await expect(link).toHaveCount(1);
    await expect(link).toContainText(town.title);
    await expect(link).toContainText(town.county);
    await expect(link).toHaveAttribute("href", town.href);
    await link.click();
    await expectOpenedTown(page, town.href, town.title);
  }
  expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
  expect(errors).toEqual([]);
});

test("disambiguates Washington townships and supports mobile keyboard navigation", async ({ page }) => {
  await preparePage(page, "dark");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  const input = await openFinder(page);
  await input.fill("Washington Township");
  const links = page.getByRole("list", { name: "Matching towns", exact: true }).getByRole("link");
  await expect(links).toHaveCount(2);
  await expect(links.filter({ hasText: "Burlington County" }))
    .toHaveAttribute("href", "/burlington-county#washington-township-burlington-county");
  await expect(links.filter({ hasText: "Gloucester County" }))
    .toHaveAttribute("href", "/gloucester-county#washington-township");
  await expect(page.getByRole("search", { name: "Town directory", exact: true }).getByRole("status"))
    .toHaveText("2 towns found.");
  expect(await page.locator(".town-finder").evaluate((finder) => {
    const controls = finder.querySelectorAll("input, button, .town-finder-results a");
    return Array.from(controls).every((control) => {
      const bounds = control.getBoundingClientRect();
      return bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
    });
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await input.press("Enter");
  await expect(links.first()).toBeFocused();
  await input.focus();
  await input.press("ArrowDown");
  await expect(links.first()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  const destination = await links.nth(1).getAttribute("href");
  const title = await links.nth(1).locator("strong").innerText();
  await page.keyboard.press("Enter");
  await expectOpenedTown(page, destination!, title);
});

test("keeps searches local, caps broad results, and clears empty-state queries accessibly", async ({ page }) => {
  await preparePage(page);
  const apiRequests: string[] = [];
  await page.route("**/rest/v1/site_pages?*", (route) => {
    apiRequests.push(route.request().url());
    return route.fulfill({ contentType: "application/json", body: "[]" });
  });
  const input = await openFinder(page);
  const search = page.getByRole("search", { name: "Town directory", exact: true });
  const status = search.getByRole("status");
  const transmissions: string[] = [];
  page.on("request", (request) => transmissions.push(`${request.url()} ${request.postData() || ""}`));

  await input.fill("Gloucester County");
  await expect(search.getByRole("list", { name: "Matching towns", exact: true }).getByRole("link")).toHaveCount(8);
  await expect(status).toContainText("Showing the first 8; keep typing to narrow the list.");
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(search.getByRole("list", { name: "Matching towns", exact: true })).toHaveCount(0);

  const query = "SJRE private search fixture 72654";
  await input.fill(query);
  await expect(status).toHaveText("No towns found. Try another name, or browse the counties below.");
  await search.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(status).toHaveText("");
  await expect(page).toHaveURL("/counties");
  expect(apiRequests).toHaveLength(1);
  expect(transmissions.some((request) => decodeURIComponent(request).includes(query))).toBe(false);
  expect(transmissions.filter((request) => /google-analytics|googletagmanager|doubleclick/i.test(request))).toEqual([]);
  expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
});

test("waits for the seven published counties and respects owner renames and removals", async ({ page }) => {
  await preparePage(page);
  const editedTitle = "Merchantville Village Notes";
  const editedHref = "/camden-county#merchantville-village-notes";
  const rows = Object.entries(profiles.counties).map(([path, county]) => ({
    page_key: path,
    published_at: "2026-10-17T12:00:00Z",
    published_content: {
      communitySummariesVersion: 1,
      page: {
        path,
        title: county.name,
        sections: county.communities.flatMap((town, index) => {
          if (path === "/burlington-county" && town.title === "Bass River Township") return [];
          return [{
            id: legacy.counties[path][index].id,
            kind: "town",
            blocks: [
              { tag: "H3", text: path === "/camden-county" && town.title === "Merchantville" ? editedTitle : town.title },
              { tag: "P", text: town.summary },
              { tag: "P", text: "Owner's retained expanded town detail." },
              ...town.sources.map((source) => ({ tag: "SOURCE", text: source.title, href: source.href, accessed: source.accessed })),
            ],
            images: [],
          }];
        }),
      },
    },
  }));
  let releasePublished!: () => void;
  const publishedReady = new Promise<void>((resolve) => { releasePublished = resolve; });
  const requestedKeys: string[] = [];
  await page.route("**/rest/v1/site_pages?*", async (route) => {
    const keys = new URL(route.request().url()).searchParams.get("page_key")!;
    requestedKeys.push(keys);
    if (keys.includes("/counties")) await publishedReady;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(rows.filter((row) => keys.includes(row.page_key))) });
  });
  await page.goto("/counties", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("searchbox", { name: "Find a town", exact: true });
  await expect(input).toBeDisabled();
  await expect(page.locator(".town-finder").getByRole("status")).toHaveText("Loading towns…");
  releasePublished();
  await expect(input).toBeEnabled();
  expect(requestedKeys).toEqual([`in.(${["__sitewide__", "/counties", ...Object.keys(profiles.counties)].join(",")})`]);

  await input.fill("Bass River");
  await expect(page.locator(".town-finder").getByRole("status")).toContainText("No towns found.");
  await input.fill("Merchantville");
  const result = page.getByRole("list", { name: "Matching towns", exact: true }).getByRole("link");
  await expect(result).toHaveCount(1);
  await expect(result.locator("strong")).toHaveText(editedTitle);
  await expect(result).toHaveAttribute("href", editedHref);
  await input.press("ArrowDown");
  await expect(result).toBeFocused();
  await page.keyboard.press("Enter");
  await expectOpenedTown(page, editedHref, editedTitle);
  await expect(page.locator("article#merchantville-village-notes .town-card-details"))
    .toContainText("Owner's retained expanded town detail.");
});

test("preserves a published-only town anchor opened natively in a new tab with stored analytics consent", async ({ context, page }) => {
  await context.addInitScript(() => {
    localStorage.setItem("analytics-consent", "granted");
    localStorage.setItem("site-theme", "light");
  });
  await context.route(/https:\/\/[^/]*(?:google-analytics|googletagmanager|doubleclick|googleadservices|analytics\.google)[^/]*\//, (route) => (
    route.request().resourceType() === "script"
      ? route.fulfill({ contentType: "application/javascript", body: "" })
      : route.fulfill({ status: 204, body: "" })
  ));
  const path = "/camden-county";
  const county = profiles.counties[path];
  const index = county.communities.findIndex((town) => town.title === "Merchantville");
  const town = county.communities[index];
  const title = "Merchantville Published Village";
  const destination = `${path}#merchantville-published-village`;
  const row = {
    page_key: path,
    published_at: "2026-10-17T12:00:00Z",
    published_content: {
      communitySummariesVersion: 1,
      page: {
        path,
        title: county.name,
        sections: [{
          id: legacy.counties[path][index].id,
          kind: "town",
          blocks: [
            { tag: "H3", text: title },
            { tag: "P", text: town.summary },
            { tag: "P", text: "Published-only town details." },
            ...town.sources.map((source) => ({ tag: "SOURCE", text: source.title, href: source.href, accessed: source.accessed })),
          ],
          images: [],
        }],
      },
    },
  };
  let releaseCounty!: () => void;
  const countyReady = new Promise<void>((resolve) => { releaseCounty = resolve; });
  let countyRequested = false;
  await context.route("**/rest/v1/site_pages?*", async (route) => {
    const keys = new URL(route.request().url()).searchParams.get("page_key")!;
    if (!keys.includes("/counties")) {
      countyRequested = true;
      await countyReady;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([row]) });
  });
  const transmissions: string[] = [];
  context.on("request", (request) => transmissions.push(`${request.url()} ${request.postData() || ""}`));
  const input = await openFinder(page);
  const privateQuery = "SJRE confidential search fixture 88321";
  await input.fill(privateQuery);
  await expect(page.locator(".town-finder").getByRole("status")).toContainText("No towns found.");
  await input.fill("Merchantville");
  const result = page.getByRole("list", { name: "Matching towns", exact: true }).getByRole("link");
  await expect(result).toHaveAttribute("href", destination);

  const newTab = context.waitForEvent("page");
  await result.click({ button: "middle" });
  const opened = await newTab;
  try {
    await opened.waitForLoadState("domcontentloaded");
    await expect.poll(() => countyRequested).toBe(true);
    await expect(opened.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
    await expect(opened).toHaveURL(destination);
    await expect(opened.locator("article#merchantville-published-village")).toHaveCount(0);
    releaseCounty();
    await expectOpenedTown(opened, destination, title);
    await expect(opened.locator("article#merchantville-published-village .town-card-details"))
      .toContainText("Published-only town details.");
    expect(transmissions.some((request) => decodeURIComponent(request).includes(privateQuery))).toBe(false);
    expect(await page.evaluate((query) => JSON.stringify(window.dataLayer || []).includes(query), privateQuery)).toBe(false);
    expect(await opened.evaluate((query) => JSON.stringify(window.dataLayer || []).includes(query), privateQuery)).toBe(false);
    await expect(page).toHaveURL("/counties");
  } finally {
    releaseCounty();
    await opened.close();
  }
});
