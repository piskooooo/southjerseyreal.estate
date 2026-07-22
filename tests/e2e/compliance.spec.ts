import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const readJson = <T,>(relativePath: string): T => JSON.parse(
  readFileSync(new URL(relativePath, import.meta.url), "utf8"),
) as T;

type ComplianceData = {
  agentLicensedName: string;
  brokerDescriptor: string;
  brokerLegalName: string;
  brokerWebsite: string;
  licensedOfficePhone: string;
  licensedOfficePhoneHref: string;
  realtorMembershipVerified: boolean;
};

const compliance = readJson<ComplianceData>("../../src/content/complianceData.json");
const seoEntries = readJson<Array<{ path: string; title: string; description: string }>>("../../src/content/seoEntries.json");

const routes = seoEntries.map((entry) => entry.path);
const siteUrl = "https://southjerseyreal.estate";
const screenshotDir = "test-results/compliance-screenshots";

const readDistFile = (fileName: string) => readFileSync(
  new URL(`../../dist/${fileName}`, import.meta.url),
  "utf8",
);

const prerenderedHtmlForPath = (path: string) => readDistFile(
  path === "/" ? "index.html" : `${path.slice(1)}.html`,
);

const structuredDataFromHtml = (html: string) => {
  const match = html.match(/<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return match ? JSON.parse(match[1]) as Record<string, unknown> : undefined;
};

async function denyAnalyticsBeforeLoad(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("analytics-consent", "denied"));
}

async function openHydratedRoute(page: Page, path: string) {
  await denyAnalyticsBeforeLoad(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator("#page h1")).toHaveCount(1);
  await expect(page.locator("#page h1")).toBeVisible();
  await page.waitForTimeout(250);
}

test.describe("compliance route crawl", () => {
  for (const entry of seoEntries) {
    test(`${entry.path} has the required rendered disclosure and metadata`, async ({ page }) => {
      await openHydratedRoute(page, entry.path);

      const footerDisclosure = page.locator(".brokerage-disclosure-footer");
      await expect(page.locator(".brokerage-disclosure-header")).toHaveCount(0);
      await expect(footerDisclosure).toBeVisible();
      await expect(footerDisclosure).toContainText(compliance.brokerLegalName);
      await expect(footerDisclosure).toContainText(compliance.brokerDescriptor);
      await expect(footerDisclosure).toContainText(compliance.licensedOfficePhone);
      await expect(footerDisclosure.locator(".brokerage-legal-name")).toHaveAttribute("href", compliance.brokerWebsite);

      const fairHousing = page.locator(".fair-housing-notice");
      await expect(fairHousing).toContainText("Equal Housing Opportunity");
      await expect(fairHousing.getByAltText("Equal Housing Opportunity")).toBeVisible();
      await expect(fairHousing.getByAltText("REALTOR® member logo")).toBeVisible();

      const renderedText = await page.locator("body").innerText();
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
      const parsedStructuredData = JSON.parse(structuredData || "{}") as Record<string, unknown>;
      const graph = parsedStructuredData["@graph"] as Array<Record<string, unknown>>;
      const website = graph.find((item) => item["@type"] === "WebSite");
      const brokerage = graph.find((item) => item["@id"] === `${siteUrl}/#brokerage`);
      const agent = graph.find((item) => item["@id"] === `${siteUrl}/#agent`);
      expect(website?.name).toBe("South Jersey Real Estate");
      if (["/about", "/contact"].includes(entry.path)) {
        expect(brokerage?.name).toBe(compliance.brokerLegalName);
        expect(brokerage?.description).toBe(compliance.brokerDescriptor);
        expect(brokerage?.telephone).toBe(compliance.licensedOfficePhoneHref.replace("tel:", ""));
        expect((agent?.worksFor as Record<string, unknown>)?.["@id"]).toBe(`${siteUrl}/#brokerage`);
      } else {
        expect(brokerage).toBeUndefined();
        expect(agent).toBeUndefined();
      }

      const prerenderedHtml = prerenderedHtmlForPath(entry.path);
      expect(prerenderedHtml).toContain('data-seo-prerendered="true"');
      expect(prerenderedHtml).not.toContain("brokerage-disclosure-header");
      expect(prerenderedHtml).toContain("brokerage-disclosure-footer");
      expect(prerenderedHtml).toMatch(/<h1>[^<]+<\/h1>/);
      expect(prerenderedHtml).toMatch(/<nav aria-label="Related pages">/);
      expect(structuredDataFromHtml(prerenderedHtml)).toEqual(parsedStructuredData);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test("prerendered breadcrumbs use the site hierarchy and omit a one-item home trail", () => {
  const homeGraph = structuredDataFromHtml(prerenderedHtmlForPath("/"))?.["@graph"] as Array<Record<string, unknown>>;
  expect(homeGraph.some((item) => item["@type"] === "BreadcrumbList")).toBe(false);

  const countyGraph = structuredDataFromHtml(prerenderedHtmlForPath("/atlantic-county"))?.["@graph"] as Array<Record<string, unknown>>;
  const breadcrumbs = countyGraph.find((item) => item["@type"] === "BreadcrumbList");
  expect(breadcrumbs?.itemListElement).toEqual([
    expect.objectContaining({ position: 1, name: "Home", item: `${siteUrl}/` }),
    expect.objectContaining({ position: 2, name: "Counties", item: `${siteUrl}/counties` }),
    expect.objectContaining({ position: 3, item: `${siteUrl}/atlantic-county` }),
  ]);
});

test("production artifacts include truthful sitemap metadata, canonical redirects, and non-indexable special entries", () => {
  const sitemap = readDistFile("sitemap.xml");
  expect(sitemap.match(/<url>/g)).toHaveLength(routes.length);
  for (const lastmod of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    expect(lastmod[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }

  const redirects = readDistFile("_redirects");
  expect(redirects).toContain("/home / 301");
  expect(redirects).toContain("/main / 301");

  const notFound = readDistFile("404.html");
  expect(notFound).toContain('<meta name="robots" content="noindex, follow"');
  expect(notFound).toContain("This page is not available.");
  expect(notFound).not.toContain('rel="canonical"');
  expect(notFound).not.toContain('id="structured-data"');

  const admin = readDistFile("admin.html");
  expect(admin).toContain('<meta name="robots" content="noindex, nofollow, noarchive"');
  expect(admin).toContain("Opening website editor…");
  expect(admin).not.toContain('rel="canonical"');
  expect(admin).not.toContain('id="structured-data"');
});

test("sitewide footer disclosure remains prominent and readable at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openHydratedRoute(page, "/about");

  const disclosure = page.locator(".brokerage-disclosure-footer");
  const broker = disclosure.locator(".brokerage-legal-name");
  const agent = disclosure.locator(".agent-license-disclosure");
  const sizes = await page.evaluate(() => ({
    broker: Number.parseFloat(getComputedStyle(document.querySelector(".brokerage-disclosure-footer .brokerage-legal-name")!).fontSize),
    agent: Number.parseFloat(getComputedStyle(document.querySelector(".brokerage-disclosure-footer .agent-license-disclosure")!).fontSize),
  }));

  await expect(disclosure).toBeVisible();
  await expect(broker).toBeVisible();
  await expect(agent).toBeVisible();
  expect(sizes.broker).toBeGreaterThan(sizes.agent);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await page.locator(".fair-housing-notice a").click();
  await expect(page).toHaveURL(/\/disclaimer$/);
  await expect(page.getByRole("heading", { level: 2, name: "Fair housing" })).toBeVisible();
  await expect(page.locator("main")).toContainText("source of lawful income used for rental or mortgage payments");
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

  await page.getByRole("button", { name: "Cookie Settings" }).click();
  await page.getByRole("button", { name: "Accept Analytics" }).click();
  await expect(page.locator("#ga4-script")).toHaveCount(1);
  expect(await page.evaluate(() => window.localStorage.getItem("analytics-consent"))).toBe("granted");
});

test("optional support link keeps the newsletter free and records a GA4 outbound click", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 900 });
  await openHydratedRoute(page, "/newsletter");
  await page.getByRole("button", { name: "Cookie Settings" }).click();
  await page.getByRole("button", { name: "Accept Analytics" }).click();

  const support = page.locator(".site-footer-support");
  const supportLink = support.getByRole("link", { name: "Support SJRE", exact: true });
  await expect(support).toContainText("Optional support. The newsletter remains free.");
  await expect(supportLink).toHaveAttribute(
    "href",
    "https://ko-fi.com/southjerseyrealestate?utm_source=southjerseyreal.estate&utm_medium=website&utm_campaign=sjre_support",
  );
  await expect(supportLink).toHaveAttribute("target", "_blank");
  await expect(supportLink).toHaveAttribute("rel", "noreferrer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  await supportLink.dispatchEvent("click");
  const analytics = await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
  expect(analytics).toEqual(expect.arrayContaining([
    expect.arrayContaining(["event", "outbound_click", expect.objectContaining({
      destination_type: "external",
      link_source: "footer_support",
      link_url: "https://ko-fi.com/southjerseyrealestate",
    })]),
  ]));
});

test("unpaid providers and paid local advertising remain separate", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 900 });
  await openHydratedRoute(page, "/partners");
  await page.getByRole("button", { name: "Cookie Settings" }).click();
  await page.getByRole("button", { name: "Accept Analytics" }).click();
  await expect(page.locator("#ga4-script")).toHaveCount(1);
  const main = page.locator("main");
  await expect(main).toContainText("Unpaid directory");
  await expect(main).toContainText("receive no fee or other compensation");
  await expect(main).toContainText("You are free to choose any provider");
  await expect(main).toContainText("not a guarantee or warranty");
  await expect(page.locator("footer")).toContainText(compliance.brokerLegalName);
  const partnerPanel = page.locator("#partners-and-vendors");
  await partnerPanel.locator("summary").click();
  await expect(main).toContainText("HomeBase CRM is owned by Fat Cat Finance, LLC");
  await expect(main).toContainText("no payment or cross-ownership relationship");
  await expect(main).toContainText("disclosed brokerage affiliation, not a paid directory placement");
  const homeBaseLink = partnerPanel.getByRole("link", { name: "Visit HomeBase CRM", exact: true });
  const brokerageLink = partnerPanel.getByRole("link", { name: "Visit The Plum Real Estate Group", exact: true });
  await expect(homeBaseLink).toHaveAttribute("target", "_blank");
  await expect(homeBaseLink).toHaveAttribute("rel", "noreferrer");
  await expect(brokerageLink).toHaveAttribute("target", "_blank");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await homeBaseLink.dispatchEvent("click");
  await brokerageLink.dispatchEvent("click");
  const partnerAnalytics = await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
  expect(partnerAnalytics).toEqual(expect.arrayContaining([
    expect.arrayContaining(["event", "outbound_click", expect.objectContaining({
      destination_type: "external",
      link_source: "content_button",
      link_url: "https://homebasecrm.com/",
    })]),
    expect.arrayContaining(["event", "outbound_click", expect.objectContaining({
      destination_type: "external",
      link_source: "content_button",
      link_url: "https://www.theplumrealestategroup.com/",
    })]),
  ]));
  await page.locator("#mortgage-professionals summary").click();
  await expect(main).toContainText("Sam Hamilton");
  await expect(main).toContainText("NMLS #1094595");
  await expect(main).toContainText("Terri Santiago-Parker");
  await expect(main.locator('a[href="https://lo.citizensbank.com/nj/marlton/drew-whipple"]')).toBeVisible();
  await page.locator("#title-companies summary").click();
  await expect(main).toContainText("Foundation Title, LLC");
  await expect(main).not.toContainText("Signature Title Agency");

  await openHydratedRoute(page, "/advertise");
  const advertising = page.locator("main");
  await expect(advertising).toContainText("not part of a real estate transaction");
  await expect(advertising).toContainText("Paid advertisement");
  await expect(advertising).toContainText("separate from the unpaid Real Estate Provider Directory");
  await advertising.locator("#advertising-options summary").click();
  await expect(advertising).toContainText("County or town placement");
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
  await expect(page.getByRole("heading", { level: 1, name: "South Jersey Counties" })).toBeVisible();
  await expect(desktopNav.getByRole("link", { name: "Counties", exact: true })).toHaveAttribute("aria-current", "page");

  const analyticsCommands = await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
  expect(analyticsCommands).toEqual(expect.arrayContaining([
    expect.arrayContaining(["event", "internal_link_click", expect.objectContaining({
      destination_type: "internal",
      link_url: "/counties",
      link_source: "header_hub",
    })]),
  ]));
  expect(JSON.stringify(analyticsCommands)).not.toContain("link_text");

  const pageViews = analyticsCommands.filter((entry) => entry[0] === "event" && entry[1] === "page_view");
  expect(pageViews).toHaveLength(2);
  expect(pageViews[1]).toEqual(expect.arrayContaining([
    "event",
    "page_view",
    expect.objectContaining({
      page_location: "http://127.0.0.1:4173/counties",
      page_path: "/counties",
      page_referrer: "http://127.0.0.1:4173/",
    }),
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
  await expect(page).toHaveTitle("Page Not Found | South Jersey Real Estate");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator("#structured-data")).toHaveCount(0);
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

test("homepage preserves the oversized headline overlap on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1653, height: 900 });
  await openHydratedRoute(page, "/");

  const composition = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>(".hero-copy h1, .hero-copy h2");
    const image = document.querySelector<HTMLElement>(".hero-image");
    if (!heading || !image) return null;

    const headingRect = heading.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const headingStyle = getComputedStyle(heading);

    return {
      headingWidth: headingRect.width,
      imageLeft: imageRect.left,
      overlap: headingRect.right - imageRect.left,
      viewportWidth: window.innerWidth,
      whiteSpace: headingStyle.whiteSpace,
    };
  });

  expect(composition).not.toBeNull();
  expect(composition!.whiteSpace).toBe("nowrap");
  expect(composition!.headingWidth).toBeGreaterThan(composition!.viewportWidth * 0.75);
  expect(composition!.overlap).toBeGreaterThan(300);
  expect(composition!.imageLeft).toBeGreaterThan(0);
});

test("first-time visitors receive the light editorial theme", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("site-theme"));
  await openHydratedRoute(page, "/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
});

test("representative desktop and mobile screenshots render without overflow", async ({ page }) => {
  for (const route of ["/", "/counties", "/connect", "/atlantic-county", "/contact", "/partners"]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openHydratedRoute(page, route);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".brokerage-disclosure-header")).toHaveCount(0);
    await expect(page.locator(".brokerage-disclosure-footer")).toHaveCount(1);
    await page.screenshot({ path: `${screenshotDir}/desktop-${route === "/" ? "home" : route.slice(1)}.png` });
  }

  for (const route of ["/", "/counties", "/connect", "/contact", "/partners"]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await openHydratedRoute(page, route);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".brokerage-disclosure-header")).toHaveCount(0);
    await expect(page.locator(".brokerage-disclosure-footer")).toHaveCount(1);
    await expect(page.locator("#page h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${screenshotDir}/mobile-${route === "/" ? "home" : route.slice(1)}.png` });
  }
});
