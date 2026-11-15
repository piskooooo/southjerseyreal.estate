import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { gclGuide, gclGuidePath, gclMapEmbedUrl, gclMapViewerUrl } from "../../src/content/gclGuide";

// Browser plugin not available. The Mac Chrome connector could not connect;
// use the repository's bundled Chromium for rendered validation.
// Flow: Insights search -> GCL guide -> map activation/unload -> printable station list.
const csp = readFileSync(new URL("../../public/_headers", import.meta.url), "utf8")
  .split("\n").find((line) => line.trim().startsWith("Content-Security-Policy:"))!
  .trim().slice("Content-Security-Policy:".length).trim()
  // The compliance build substitutes this backend. Keep all iframe rules exact.
  .replace("https://sinbxruqlaywvbzcvfli.supabase.co", "https://test-project.supabase.co");
const stationNames = gclGuide.sections.find((section) => section.orderedList)!.orderedList!;

for (const { width, theme } of [
  { width: 1440, theme: "light" }, { width: 390, theme: "dark" }, { width: 320, theme: "light" },
] as const) {
  test(`GCL map is requested only on activation and keeps a readable ${width}px ${theme} guide`, async ({ page }) => {
    const errors: string[] = [];
    const googleRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("request", (request) => {
      if (new URL(request.url()).hostname === "www.google.com") googleRequests.push(request.url());
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript((theme) => {
      localStorage.setItem("analytics-consent", "denied");
      localStorage.setItem("site-theme", theme);
    }, theme);
    // Vite preview does not apply Pages _headers. Apply the actual public CSP
    // to the top-level document so this check catches a blocked Maps embed.
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "document" && new URL(route.request().url()).hostname === "127.0.0.1") {
        const response = await route.fetch();
        await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": csp } });
      } else await route.continue();
    });
    await page.route(gclMapEmbedUrl, (route) => route.fulfill({
      contentType: "text/html", body: "<!doctype html><html lang='en'><title>Map fixture</title><body>GCL station map</body></html>",
    }));
    await page.route("https://test-project.supabase.co/rest/v1/site_pages?**", (route) => route.fulfill({ json: [] }));
    await page.goto("/insights");
    await page.getByRole("searchbox", { name: "Find a guide" }).fill("Lanning Square");
    await expect(page.locator(".insight-card")).toHaveCount(1);
    await page.locator(".insight-card h2 a").click();
    await expect(page).toHaveURL(new RegExp(`${gclGuidePath}$`));
    await expect(page).toHaveTitle(/Glassboro–Camden Line/);
    await expect(page.locator("#page h1")).toHaveText(gclGuide.title);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".insight-ordered-list li")).toHaveText(stationNames);
    await expect(page.locator(".insight-map iframe")).toHaveCount(0);
    expect(googleRequests).toEqual([]);
    const activation = page.getByRole("button", { name: "Load interactive map", exact: true });
    await activation.focus();
    await page.keyboard.press("Enter");
    await expect(page.frameLocator(".insight-map iframe").getByText("GCL station map")).toBeVisible();
    expect(googleRequests).toEqual([gclMapEmbedUrl]);
    await expect(page.locator(".insight-map iframe")).toHaveAttribute("referrerpolicy", "no-referrer");
    await expect(page.getByRole("link", { name: "Open in Google Maps", exact: true })).toHaveAttribute("href", gclMapViewerUrl);
    await page.getByRole("button", { name: "Unload interactive map" }).click();
    await expect(page.locator(".insight-map iframe")).toHaveCount(0);
    await expect(activation).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).include("#page").analyze()).violations).toEqual([]);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".insight-map-frame")).toBeHidden();
    await expect(activation).toBeHidden();
    await expect(page.locator(".insight-ordered-list li")).toHaveText(stationNames);
    await expect(page.getByRole("link", { name: "Open in Google Maps", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("GCL initial HTML provides the station list and map link without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(gclGuidePath);
    await expect(page.locator("#page h1")).toHaveText(gclGuide.title);
    await expect(page.locator(".insight-ordered-list li")).toHaveText(stationNames);
    await expect(page.getByRole("link", { name: "Open in Google Maps", exact: true })).toHaveAttribute("href", gclMapViewerUrl);
    await expect(page.locator("iframe")).toHaveCount(0);
  } finally { await context.close(); }
});
