import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  for (const width of [1280, 1440]) {
    test(`${theme} homepage keeps body copy clear of the photo at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/*", (route) => {
        const hostname = new URL(route.request().url()).hostname;
        return hostname === "127.0.0.1" || hostname === "localhost" ? route.continue() : route.abort();
      });
      await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ json: [] }));
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("analytics-consent", "denied");
        window.localStorage.setItem("site-theme", selectedTheme);
      }, theme);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
      const hero = page.locator(".home-welcome-hero");
      await expect(hero.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => hero.locator(".hero-image").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

      const bounds = await hero.evaluate((element) => {
        const copy = element.querySelector(".hero-copy")!.getBoundingClientRect();
        const photo = element.querySelector(".hero-image")!.getBoundingClientRect();
        const headline = element.querySelector("h1")!.getBoundingClientRect();
        return {
          copyLeft: copy.left,
          copyRight: copy.right,
          photoLeft: photo.left,
          headlineRight: headline.right,
          paragraphs: [...element.querySelectorAll(".hero-copy p")].map((paragraph) => {
            const rect = paragraph.getBoundingClientRect();
            return { text: paragraph.textContent, left: rect.left, right: rect.right };
          }),
        };
      });
      await page.screenshot({ path: testInfo.outputPath(`home-${theme}-${width}.png`) });

      expect(bounds.paragraphs.length).toBeGreaterThan(0);
      for (const paragraph of bounds.paragraphs) {
        expect.soft(paragraph.left, paragraph.text ?? "paragraph left edge").toBeGreaterThanOrEqual(bounds.copyLeft - 1);
        expect.soft(paragraph.right, paragraph.text ?? "paragraph right edge").toBeLessThanOrEqual(bounds.copyRight + 1);
        expect.soft(paragraph.right, paragraph.text ?? "paragraph clears photo").toBeLessThanOrEqual(bounds.photoLeft);
      }
      expect(bounds.headlineRight, "the oversized headline still spans beyond the copy column").toBeGreaterThan(bounds.copyRight);
    });
  }
}
