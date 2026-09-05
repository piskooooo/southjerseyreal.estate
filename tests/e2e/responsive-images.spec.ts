import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

async function useLocalContent(page: Page, theme: "light" | "dark") {
  await page.route("**/*", async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === "127.0.0.1" || hostname === "localhost") await route.continue();
    else await route.abort();
  });
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ json: [] }));
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("analytics-consent", "denied");
    window.localStorage.setItem("site-theme", selectedTheme);
  }, theme);
}

async function openHome(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator(".hero-image")).toBeVisible();
  await expect.poll(() => page.locator(".hero-image").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
}

for (const theme of ["light", "dark"] as const) {
  test(`desktop preloads one matching responsive ${theme} hero without changing its composition`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await useLocalContent(page, theme);
    const photo = theme === "light" ? "home-beach" : "home-skyline";
    const requests: string[] = [];
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (/\/assets\/responsive\/home-(beach|skyline)-/.test(pathname)) requests.push(pathname);
    });
    await openHome(page);

    const hero = page.locator(".hero-image");
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute("href", `/assets/responsive/${photo}-960.webp`);
    await expect(preload).toHaveAttribute("fetchpriority", "high");
    await expect(preload).toHaveAttribute("media", "(min-width: 901px)");
    expect(await preload.getAttribute("imagesrcset")).toBe(await hero.getAttribute("srcset"));
    expect(await preload.getAttribute("imagesizes")).toBe(await hero.getAttribute("sizes"));

    const imageState = await hero.evaluate((image: HTMLImageElement) => ({
      path: new URL(image.currentSrc).pathname,
      alt: image.alt,
      fit: getComputedStyle(image).objectFit,
      position: getComputedStyle(image).objectPosition,
      top: image.getBoundingClientRect().top,
    }));
    expect(imageState.path).toMatch(new RegExp(`/assets/responsive/${photo}-\\d+\\.webp$`));
    expect(imageState.alt).toMatch(theme === "light" ? /sunrise.*beach/i : /skyline/i);
    expect(imageState.fit).toBe("cover");
    expect(imageState.position).toBe("50% 50%");
    expect(imageState.top).toBeLessThan(900);
    expect(requests).toEqual([imageState.path]);

    const guidance = page.locator(".home-guidance-teaser img");
    await expect(guidance).toHaveAttribute("src", "/assets/responsive/home-pitman-960.webp");
    await expect(guidance).toHaveAttribute("loading", "lazy");
    await expect(guidance).toHaveAttribute("decoding", "async");
  });
}

test.describe("mobile responsive images", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });

  test("shows the mobile hero after the introduction without preloading and loads clear lazy footer marks", async ({ page }) => {
    await useLocalContent(page, "light");
    await openHome(page);
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
    const heroState = await page.locator(".hero-image").evaluate((image: HTMLImageElement) => ({
      path: new URL(image.currentSrc).pathname,
      top: image.getBoundingClientRect().top,
      introductionBottom: document.querySelector(".hero-copy")!.getBoundingClientRect().bottom,
    }));
    expect(heroState.path).toBe("/assets/responsive/home-beach-960.webp");
    expect(heroState.top).toBeGreaterThanOrEqual(heroState.introductionBottom);

    const marks = page.locator(".footer-credential-logos img");
    await expect(marks).toHaveCount(2);
    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute("loading", "lazy");
      await expect(mark).toHaveAttribute("decoding", "async");
      await mark.scrollIntoViewIfNeeded();
      await expect.poll(() => mark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      const size = await mark.evaluate((image: HTMLImageElement) => ({ naturalWidth: image.naturalWidth, renderedWidth: image.getBoundingClientRect().width }));
      expect(size.naturalWidth).toBe(120);
      expect(size.renderedWidth).toBeLessThanOrEqual(40);
      expect(size.naturalWidth).toBeGreaterThanOrEqual(size.renderedWidth * 2);
    }
    await expect(marks.nth(0)).toHaveAttribute("alt", "Equal Housing Opportunity");
    await expect(marks.nth(1)).toHaveAttribute("alt", "REALTOR® member logo");
  });
});

test("only homepage artifacts contain hero preloading", async ({ page }) => {
  const routes = JSON.parse(readFileSync(new URL("../../src/content/seoEntries.json", import.meta.url), "utf8")) as Array<{ path: string }>;
  for (const file of [...routes.map(({ path }) => path === "/" ? "index.html" : `${path.slice(1)}.html`), "404.html", "admin.html"]) {
    const html = readFileSync(new URL(`../../dist/${file}`, import.meta.url), "utf8");
    expect(html.includes('id="home-hero-preload"'), file).toBe(file === "index.html");
  }
  await useLocalContent(page, "light");
  await page.goto("/insights", { waitUntil: "domcontentloaded" });
  await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
});
