import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

// Browser plugin not available; use the repository's configured Playwright browser.
const profiles = JSON.parse(readFileSync(new URL("../../src/content/communityProfiles.json", import.meta.url), "utf8")) as {
  counties: Record<string, { name: string; communities: Array<{ title: string; summary: string }> }>;
};
const legacy = JSON.parse(readFileSync(new URL("../../src/content/legacyCommunitySummaries.json", import.meta.url), "utf8")) as {
  counties: Record<string, Array<{ id: string; summary: string; sources: Array<Record<string, string>> }>>;
};

for (const [path, county] of Object.entries(profiles.counties)) {
  test(`${county.name} upgrades old published introductions while keeping expanded snapshots`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("analytics-consent", "denied"));
    const historicalDetail = "Population: 1,234 (2020 Census)";
    const priceSnapshot = "Median sold price (2025 site snapshot): historical example";
    await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{
        page_key: path,
        published_at: "2026-08-10T12:00:00Z",
        published_content: {
          page: {
            path,
            title: county.name,
            sections: legacy.counties[path].map((entry, index) => ({
              id: entry.id,
              kind: "town",
              blocks: [
                { tag: "H3", text: county.communities[index].title },
                { tag: "P", text: entry.summary },
                { tag: "P", text: historicalDetail },
                { tag: "P", text: priceSnapshot },
                ...entry.sources,
              ],
              images: [],
            })),
          },
        },
      }]),
    }));
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
    const cards = page.locator(".town-card");
    await expect(cards).toHaveCount(county.communities.length);
    expect(await cards.locator(".town-card-summary p").allTextContents())
      .toEqual(county.communities.map((town) => town.summary));
    expect(await cards.locator(".town-card-summary h3").allTextContents())
      .toEqual(county.communities.map((town) => town.title));
    const first = cards.first();
    await first.getByRole("button", { name: `Expand ${county.communities[0].title} details`, exact: true }).click();
    await expect(first.locator(".town-card-details")).toBeVisible();
    await expect(first.locator(".town-card-details")).toContainText(historicalDetail);
    await expect(first.locator(".town-card-details")).toContainText(priceSnapshot);
    await expect(first.locator(".content-source-note")).not.toHaveCount(0);
    expect(await first.locator(".content-source-note").allTextContents())
      .toEqual(expect.arrayContaining([expect.stringContaining("Accessed 2026-10-17.")]));
    expect(await page.evaluate(() => window.dataLayer || [])).toEqual([]);
    expect(errors).toEqual([]);
  });
}
