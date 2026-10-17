import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Browser plugin not available; use the repository's configured Playwright browser.
const imageSources = JSON.parse(readFileSync(
  new URL("../../src/content/communityImageSources.json", import.meta.url),
  "utf8",
)) as Record<string, { county: string }>;

const counties = [
  ["atlantic", "Atlantic County"],
  ["burlington", "Burlington County"],
  ["camden", "Camden County"],
  ["cape-may", "Cape May County"],
  ["cumberland", "Cumberland County"],
  ["gloucester", "Gloucester County"],
  ["salem", "Salem County"],
] as const;

type CommunitySnapshot = {
  key: string;
  anchor: string;
  heading: string;
  summary: string;
  sources: Array<{ title: string; href: string; accessed: string }>;
};

async function communitySnapshots(profiles: Locator): Promise<CommunitySnapshot[]> {
  return profiles.evaluateAll((articles) => articles.map((article) => {
    const text = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();
    const summary = article.querySelector(".town-card-summary");
    return {
      key: article.getAttribute("data-town-card-key") || "",
      anchor: article.id,
      heading: text(summary?.querySelector("h1, h2, h3, h4")?.textContent),
      summary: text(summary?.querySelector("p")?.textContent),
      sources: Array.from(article.querySelectorAll(".content-source-note"), (note) => ({
        title: text(note.querySelector("a")?.textContent),
        href: note.querySelector("a")?.getAttribute("href") || "",
        accessed: note.textContent?.match(/Accessed (\d{4}-\d{2}-\d{2})\./)?.[1] || "",
      })),
    };
  }));
}

async function expectUniqueIds(page: Page) {
  const ids = await page.locator("[id]").evaluateAll((elements) => elements.map((element) => element.id));
  expect(ids.every(Boolean)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
}

async function prepareInteractivePage(page: Page) {
  await page.addInitScript(() => localStorage.setItem("analytics-consent", "denied"));
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
    contentType: "application/json",
    body: "[]",
  }));
}

test.describe("initial county community profiles", () => {
  for (const [slug, county] of counties) {
    test(`${county} serves its complete profiles before JavaScript`, async ({ browser, page, baseURL }) => {
      const expectedKeys = Object.entries(imageSources)
        .filter(([, source]) => source.county === county)
        .map(([key]) => key);
      expect(Object.keys(imageSources)).toHaveLength(166);
      expect(expectedKeys.length).toBeGreaterThan(0);

      const noScript = await browser.newContext({ baseURL, javaScriptEnabled: false });
      const initialPage = await noScript.newPage();
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      try {
        const response = await initialPage.goto(`/${slug}-county`, { waitUntil: "domcontentloaded" });
        expect(response?.status()).toBe(200);
        expect(await response?.text()).toContain("prerendered-community-profile");
        const initialProfiles = initialPage.locator("article.prerendered-community-profile");
        await expect(initialProfiles).toHaveCount(expectedKeys.length);
        const initial = await communitySnapshots(initialProfiles);
        expect(initial.map((profile) => profile.key).sort()).toEqual(expectedKeys.sort());
        expect(initial.every((profile) => profile.anchor && profile.heading && profile.summary)).toBe(true);
        expect(initial.every((profile) => profile.sources.length > 0)).toBe(true);
        expect(initial.flatMap((profile) => profile.sources).every((source) => {
          const url = new URL(source.href);
          return Boolean(source.title && source.accessed)
            && url.protocol === "https:" && !url.username && !url.password;
        })).toBe(true);
        expect(await initialProfiles.locator(".town-card-summary, .content-source-note").evaluateAll(
          (elements) => elements.every((element) => element.getClientRects().length > 0),
        )).toBe(true);
        await expectUniqueIds(initialPage);
        await expect(initialProfiles.locator("script, iframe, object, embed")).toHaveCount(0);
        expect(await initialProfiles.evaluateAll((articles) => articles.every((article) => (
          [article, ...article.querySelectorAll("*")].every((element) => (
            Array.from(element.attributes).every((attribute) => !/^on/i.test(attribute.name))
          ))
        )))).toBe(true);
        const scripts = await initialPage.locator("script").evaluateAll((elements) => elements.map((element) => ({
          id: element.id,
          type: element.getAttribute("type"),
          src: element.getAttribute("src"),
        })));
        expect(scripts.filter((script) => script.id === "structured-data")).toHaveLength(1);
        expect(scripts.every((script) => (
          script.id === "structured-data" && script.type === "application/ld+json" && !script.src
        ) || (
          !script.id && script.type === "module" && /^\/assets\/[^/?#]+\.js$/.test(script.src || "")
        ))).toBe(true);

        await prepareInteractivePage(page);
        await page.goto(`/${slug}-county`, { waitUntil: "domcontentloaded" });
        await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
        await expect(page.locator("article.prerendered-community-profile")).toHaveCount(0);
        await expect(page.locator(".town-card")).toHaveCount(expectedKeys.length);
        expect(await communitySnapshots(page.locator(".town-card"))).toEqual(initial);
        await expectUniqueIds(page);
        expect(pageErrors).toEqual([]);
      } finally {
        await noScript.close();
      }
    });
  }
});

for (const [county, anchor, title] of [
  ["camden", "cherry-hill", "Cherry Hill"],
  ["atlantic", "hamilton-township-mays-landing", "Hamilton Township (Mays Landing)"],
] as const) {
  test(`${county} town anchors expose readable profiles without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    try {
      const page = await context.newPage();
      await page.goto(`/${county}-county#${anchor}`, { waitUntil: "domcontentloaded" });
      const profile = page.locator(`article.prerendered-community-profile[id="${anchor}"]`);
      await expect(profile).toBeInViewport();
      await expect(profile.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(profile.getByRole("heading", { name: title, exact: true })).toBeInViewport();
      const headingTop = await profile.getByRole("heading", { name: title, exact: true }).evaluate((heading) => heading.getBoundingClientRect().top);
      const headerBottom = await page.locator(".site-header").evaluate((header) => header.getBoundingClientRect().bottom);
      expect(headingTop).toBeGreaterThanOrEqual(headerBottom);
      await expect(profile.locator(".town-card-summary p")).toBeVisible();
      expect(await profile.locator(".town-card-summary p").textContent()).not.toBe("");
      await expect(profile.locator(".content-source-note").first()).toBeVisible();
      await expect(profile.locator(".content-source-note").first()).toBeInViewport();
      await expect(page.locator("main").getByRole("button", { name: /expand|collapse/i })).toHaveCount(0);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await expectUniqueIds(page);
    } finally {
      await context.close();
    }
  });

  test(`${county} replaces the initial shell and preserves town interactions`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await prepareInteractivePage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${county}-county#${anchor}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
    await expect(page.locator("article.prerendered-community-profile")).toHaveCount(0);
    const profile = page.locator(`.town-card[id="${anchor}"]`);
    const toggle = profile.getByRole("button");
    await expect(toggle).toHaveAccessibleName(`Collapse ${title} details`);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(profile.locator(".town-card-details")).toBeVisible();
    await expect(profile).toBeInViewport();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(profile.locator(".town-card-details")).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/${county}-county$`));
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(profile.locator(".town-card-details")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${county}-county#${anchor}$`));
    await expectUniqueIds(page);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
}
