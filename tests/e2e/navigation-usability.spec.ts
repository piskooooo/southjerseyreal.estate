import { expect, test } from "@playwright/test";

// Browser plugin not available; use the repository's configured Playwright browser.
test.beforeEach(async ({ context }) => {
  await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
  await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => route.abort());
});

test("desktop navigation uses explicit disclosure controls and repeat clicks close them", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Counties menu", exact: true });
  await button.focus();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).not.toHaveAttribute("aria-haspopup");
  await page.keyboard.press("Enter");
  await expect(page.locator("#counties-menu")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("#counties-menu")).toBeHidden();
  await page.mouse.move(0, 0);
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

test("page navigation focuses the new heading without refocusing on theme changes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  const link = page.getByRole("link", { name: "Explore Counties", exact: true });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/counties");
  await expect(page.locator("#page h1")).toBeFocused();
  const theme = page.locator(".theme-toggle");
  await theme.focus();
  await page.keyboard.press("Enter");
  await expect(theme).toBeFocused();
});

test("Escape from a mobile navigation link returns focus to the menu button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const button = page.locator(".menu-button");
  await button.click();
  await page.locator("#mobile-menu a").first().focus();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
});

for (const width of [320, 390]) {
  test(`mobile controls and consent notice fit a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    for (const selector of [".theme-toggle", ".menu-button"]) {
      const bounds = await page.locator(selector).boundingBox();
      expect.soft(bounds!.width).toBeGreaterThanOrEqual(44);
      expect.soft(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    const banner = page.getByRole("region", { name: "Privacy choices" });
    await expect(banner).toContainText("optional and off until accepted");
    await expect(banner.getByRole("link", { name: "Privacy Policy", exact: true })).toBeVisible();
    expect((await banner.boundingBox())!.height).toBeLessThan(210);
    const decline = await banner.getByRole("button", { name: "Decline", exact: true }).boundingBox();
    const accept = await banner.getByRole("button", { name: "Accept Analytics", exact: true }).boundingBox();
    expect(Math.abs(decline!.y - accept!.y)).toBeLessThan(1);
    expect(decline!.height).toBeGreaterThanOrEqual(44);
    expect(accept!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await banner.getByRole("button", { name: "Decline", exact: true }).click();
    await expect(banner).toHaveCount(0);
    await page.getByRole("button", { name: "Cookie Settings", exact: true }).click();
    await expect(banner).toBeVisible();
  });
}
