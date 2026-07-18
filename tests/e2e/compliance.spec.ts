import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const readJson = <T,>(relativePath: string): T => JSON.parse(
  readFileSync(new URL(relativePath, import.meta.url), "utf8"),
) as T;

const compliance = readJson<Record<string, string>>("../../src/content/complianceData.json");
const seoEntries = readJson<Array<{ path: string; title: string; description: string }>>("../../src/content/seoEntries.json");

const routes = seoEntries.map((entry) => entry.path);
const siteUrl = "https://southjerseyreal.estate";
const screenshotDir = "test-results/compliance-screenshots";

async function denyAnalyticsBeforeLoad(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("analytics-consent", "denied"));
}

async function openHydratedRoute(page: Page, path: string) {
  await denyAnalyticsBeforeLoad(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#page h1")).toHaveCount(1);
  await expect(page.locator("#page h1")).toBeVisible();
  await page.waitForTimeout(250);
}

test.describe("compliance route crawl", () => {
  for (const entry of seoEntries) {
    test(`${entry.path} has the required rendered disclosure and metadata`, async ({ page }) => {
      await openHydratedRoute(page, entry.path);

      const headerDisclosure = page.locator(".brokerage-disclosure-header");
      await expect(headerDisclosure).toBeVisible();
      await expect(headerDisclosure).toContainText(compliance.brokerLegalName);
      await expect(headerDisclosure).toContainText(compliance.brokerDescriptor);
      await expect(headerDisclosure).toContainText(compliance.licensedOfficePhone);
      await expect(headerDisclosure.locator(".brokerage-legal-name")).toHaveAttribute("href", compliance.brokerWebsite);

      const fairHousing = page.locator(".fair-housing-notice");
      await expect(fairHousing).toContainText("Equal Housing Opportunity");
      await expect(fairHousing).toContainText(compliance.brokerLegalName);
      await expect(fairHousing.locator("img")).toHaveAttribute("alt", "Equal Housing Opportunity");

      const renderedText = await page.locator("body").innerText();
      expect(renderedText).not.toMatch(/REALTOR(?:®|\(R\))?/i);
      expect(renderedText).not.toMatch(/family[- ]friendly|ideal for families|perfect for families|young professionals?|retirees?|empty nesters?/i);
      expect(renderedText).not.toMatch(/safe(?:st)? (?:neighborhood|community|area)|great schools?|excellent schools?|strong schools?|reputable schools?|best school|good schools?/i);
      expect(renderedText).not.toMatch(/most sought[- ]after|exclusive|prestigious|top dollar|sell faster|deliver results/i);

      const imageAltValues = await page.locator("main img").evaluateAll((images) =>
        images.map((image) => image.getAttribute("alt")),
      );
      expect(imageAltValues.every((alt) => Boolean(alt?.trim()))).toBe(true);

      await expect(page).toHaveTitle(entry.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", entry.description);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", entry.title);
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", entry.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${siteUrl}${entry.path === "/" ? "/" : entry.path}`,
      );

      const structuredData = await page.locator("#structured-data").textContent();
      const graph = JSON.parse(structuredData || "{}")["@graph"] as Array<Record<string, unknown>>;
      expect(graph[0]?.name).toBe(compliance.brokerLegalName);
      expect(graph[0]?.description).toBe(compliance.brokerDescriptor);
      expect(graph[0]?.telephone).toBe(compliance.licensedOfficePhoneHref.replace("tel:", ""));
      expect((graph[1]?.worksFor as Record<string, unknown>)?.["@id"]).toBe(`${siteUrl}/#brokerage`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test("sitewide disclosure remains prominent and readable at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openHydratedRoute(page, "/about");

  const disclosure = page.locator(".brokerage-disclosure-header");
  const broker = disclosure.locator(".brokerage-legal-name");
  const agent = disclosure.locator(".agent-license-disclosure");
  const sizes = await page.evaluate(() => ({
    broker: Number.parseFloat(getComputedStyle(document.querySelector(".brokerage-disclosure-header .brokerage-legal-name")!).fontSize),
    agent: Number.parseFloat(getComputedStyle(document.querySelector(".brokerage-disclosure-header .agent-license-disclosure")!).fontSize),
  }));

  await expect(disclosure).toBeVisible();
  await expect(broker).toBeVisible();
  await expect(agent).toBeVisible();
  expect(sizes.broker).toBeGreaterThan(sizes.agent);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("contact and newsletter forms show the required consent and legal links", async ({ page }) => {
  await openHydratedRoute(page, "/contact");
  const contactForm = page.locator("form.contact-form");
  await expect(contactForm.locator(".form-consent")).toContainText(
    `By submitting this form, you authorize ${compliance.agentLicensedName} and ${compliance.brokerLegalName}`,
  );
  await expect(contactForm.locator(".form-consent")).toContainText("not consent to receive automated or prerecorded marketing calls or texts");
  await expect(contactForm.locator('a[href="/privacy-policy"]')).toBeVisible();
  await expect(contactForm.locator('a[href="/terms-of-service"]')).toBeVisible();

  await page.goto("/newsletter", { waitUntil: "domcontentloaded" });
  const newsletterForm = page.locator("form.newsletter-form");
  const consent = newsletterForm.locator('input[name="consent"]');
  await expect(consent).not.toBeChecked();
  await expect(consent).toHaveAttribute("required", "");
  await expect(newsletterForm).toContainText("By subscribing, you agree to receive real-estate and local-information emails");
  await expect(newsletterForm.locator('a[href="/privacy-policy"]')).toBeVisible();
  await expect(newsletterForm.locator('a[href="/terms-of-service"]')).toBeVisible();
  await expect(newsletterForm.locator('input[type="checkbox"]')).toHaveCount(1);
});

test("analytics remains off before opt-in and unloads after withdrawal", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#ga4-script")).toHaveCount(0);

  await page.getByRole("button", { name: "Accept Analytics" }).click();
  await expect(page.locator("#ga4-script")).toHaveCount(1);
  expect(await page.evaluate(() => window.localStorage.getItem("analytics-consent"))).toBe("granted");

  await page.getByRole("button", { name: "Cookie Settings" }).click();
  await page.getByRole("button", { name: "Decline" }).click();
  await expect(page.locator("#ga4-script")).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem("analytics-consent"))).toBe("denied");
});

test("provider directory shows choice and relationship disclosures", async ({ page }) => {
  await openHydratedRoute(page, "/partners");
  const main = page.locator("main");
  await expect(main).toContainText("You are free to choose any provider");
  await expect(main).toContainText("not a guarantee or warranty");
  await expect(main).toContainText("Material relationship disclosure");
  await expect(main).toContainText("Sponsored");
  await expect(main).toContainText("Paid advertisement");
  await expect(main).toContainText(compliance.brokerLegalName);
  await page.locator("#homebase-crm summary").click();
  await expect(main.locator('a[href="https://homebasecrm.com"]')).toBeVisible();
  await page.locator("#brokerage-affiliation summary").click();
  await expect(main.getByRole("link", { name: "Visit the Brokerage Website" })).toBeVisible();
  await expect(main).not.toContainText("Guaranteed Rate");
  await expect(main).not.toContainText("Foundation Title");
});

test("desktop folders switch without overlap and support keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openHydratedRoute(page, "/");
  const counties = page.getByRole("button", { name: "Counties menu" });
  const connect = page.getByRole("button", { name: "Connect menu" });

  await counties.click();
  await expect(counties).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#counties-menu")).toBeVisible();
  await connect.hover();
  await expect(counties).toHaveAttribute("aria-expanded", "false");
  await expect(connect).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#counties-menu")).toBeHidden();
  await expect(page.locator("#connect-menu")).toBeVisible();

  await page.mouse.move(0, 0);
  await page.locator(".brand").focus();
  await counties.focus();
  await expect(counties).toHaveAttribute("aria-expanded", "true");
  await expect(connect).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Escape");
  await expect(counties).toHaveAttribute("aria-expanded", "false");
  await expect(counties).toBeFocused();

  await connect.click();
  await page.locator("#page h1").click();
  await expect(connect).toHaveAttribute("aria-expanded", "false");
});

test("hub labels, history, mobile navigation, analytics, and missing routes behave correctly", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.addInitScript(() => window.localStorage.setItem("analytics-consent", "granted"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const desktopNav = page.locator(".desktop-nav");
  await desktopNav.getByRole("link", { name: "Counties", exact: true }).click();
  await expect(page).toHaveURL(/\/counties$/);
  await expect(page.getByRole("heading", { level: 1, name: "South Jersey County Guides" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Counties", exact: true })).toHaveAttribute("aria-current", "page");

  const analyticsCommands = await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
  expect(analyticsCommands).toEqual(expect.arrayContaining([
    expect.arrayContaining(["event", "internal_link_click", expect.objectContaining({
      link_url: "/counties",
      link_source: "header_hub",
    })]),
  ]));

  await desktopNav.getByRole("link", { name: "Connect", exact: true }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole("heading", { level: 1, name: "Connect and Explore" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/counties$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Connect", exact: true }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.locator("#mobile-menu")).not.toHaveClass(/is-open/);

  await page.goto("/a-page-that-does-not-exist", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "This page is not available." })).toBeVisible();
  await expect(page).toHaveTitle("Page Not Found | South Jersey Real Estate Guide");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await page.getByRole("link", { name: "Return Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

for (const route of ["/", "/counties", "/connect", "/atlantic-county", "/contact", "/partners", "/privacy-policy"]) {
  test(`automated WCAG checks pass on ${route}`, async ({ page }) => {
    await openHydratedRoute(page, route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("representative desktop and mobile screenshots render without overflow", async ({ page }) => {
  for (const route of ["/", "/counties", "/connect", "/atlantic-county", "/contact", "/partners"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openHydratedRoute(page, route);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".brokerage-disclosure-header")).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/desktop-${route === "/" ? "home" : route.slice(1)}.png` });
  }

  for (const route of ["/", "/counties", "/connect", "/contact"]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await openHydratedRoute(page, route);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".brokerage-disclosure-header")).toBeVisible();
    await expect(page.locator("#page h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${screenshotDir}/mobile-${route === "/" ? "home" : route.slice(1)}.png` });
  }
});
