import { expect, test, type Locator, type Page } from "@playwright/test";

// Browser plugin not available; use the repository's configured Playwright browser.
const enteredValues = (form: Locator) => form.evaluate((element) => {
  const values = new FormData(element as HTMLFormElement);
  // Turnstile can add or refresh its own hidden field independently of user input.
  values.delete("cf-turnstile-response");
  return Object.fromEntries(values);
});

async function openDisclosure(page: Page, form: Locator, label: string, path: string, keyboard = false) {
  const link = form.getByRole("link", { name: `${label} (opens in a new tab)`, exact: true });
  await expect(link).toHaveText(label);
  await expect(link).toHaveAttribute("href", path);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  const originalUrl = page.url();
  if (keyboard) await link.focus();
  const [opened] = await Promise.all([
    page.context().waitForEvent("page"),
    keyboard ? page.keyboard.press("Enter") : link.click(),
  ]);
  try {
    await expect(opened).toHaveURL(new URL(path, originalUrl).href);
    await expect(opened.locator("#page h1")).toBeVisible();
    await expect(opened.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
    expect(await opened.evaluate(() => window.opener)).toBeNull();
    await expect(page).toHaveURL(originalUrl);
    await expect(page.locator("html")).toHaveAttribute("data-form-draft-check", "original");
  } finally {
    await opened.close();
    await page.bringToFront();
  }
}

for (const scenario of [
  { name: "desktop light", theme: "light", viewport: { width: 1440, height: 1000 } },
  { name: "mobile dark", theme: "dark", viewport: { width: 390, height: 844 } },
]) {
  test(`form disclosure tabs preserve unsent contact and newsletter details on ${scenario.name}`, async ({ context, page }) => {
    await context.addInitScript((theme) => {
      try {
        localStorage.setItem("analytics-consent", "denied");
        localStorage.setItem("site-theme", theme);
      } catch {
        // A new tab or third-party iframe can briefly have an opaque document.
      }
    }, scenario.theme);
    await context.route("**/rest/v1/site_pages?*", (route) => route.fulfill({ contentType: "application/json", body: "[]" }));
    const submissions: string[] = [];
    const errors: string[] = [];
    await context.route(/\/functions\/v1\/(?:contact-submit|newsletter-subscribe)/, (route) => {
      submissions.push(route.request().url());
      return route.abort();
    });
    context.on("page", (opened) => opened.on("pageerror", (error) => errors.push(error.message)));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(scenario.viewport);
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    const contact = page.locator("form.contact-form");
    await contact.locator('[name="firstName"]').fill("Unsent");
    await contact.locator('[name="lastName"]').fill("QA draft");
    await contact.locator('[name="email"]').fill("unsent@example.com");
    await contact.locator('[name="phone"]').fill("856-555-0100");
    await contact.locator('[name="interest"]').selectOption("Property or real estate question");
    await contact.locator('[name="message"]').fill("Unsent privacy-link navigation check.");
    const contactDraft = await enteredValues(contact);
    await page.locator("html").evaluate((element) => element.setAttribute("data-form-draft-check", "original"));
    await openDisclosure(page, contact, "Privacy Policy", "/privacy-policy");
    expect(await enteredValues(contact)).toEqual(contactDraft);
    await openDisclosure(page, contact, "Terms of Service", "/terms-of-service", true);
    expect(await enteredValues(contact)).toEqual(contactDraft);

    await page.goto("/newsletter", { waitUntil: "domcontentloaded" });
    const newsletter = page.locator("form.newsletter-form");
    await newsletter.locator('[name="name"]').fill("Unsent newsletter draft");
    await newsletter.locator('[name="email"]').fill("unsent@example.com");
    await newsletter.locator('[name="county"]').selectOption("Camden County");
    await newsletter.locator('[name="interest"]').selectOption("Local community information");
    const consent = newsletter.locator('[name="consent"]');
    await expect(consent).not.toBeChecked();
    await page.locator("html").evaluate((element) => element.setAttribute("data-form-draft-check", "original"));
    const uncheckedDraft = await enteredValues(newsletter);
    await openDisclosure(page, newsletter, "Privacy Policy", "/privacy-policy");
    await expect(consent).not.toBeChecked();
    expect(await enteredValues(newsletter)).toEqual(uncheckedDraft);
    await consent.check();
    const checkedDraft = await enteredValues(newsletter);
    await openDisclosure(page, newsletter, "Terms of Service", "/terms-of-service", true);
    await expect(consent).toBeChecked();
    expect(await enteredValues(newsletter)).toEqual(checkedDraft);
    expect(submissions).toEqual([]);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

    const sameTabDisclosure = page.locator(".fair-housing-notice a");
    await expect(sameTabDisclosure).not.toHaveAttribute("target", "_blank");
    await sameTabDisclosure.click();
    await expect(page).toHaveURL("/disclaimer");
    await expect(page.locator("html")).toHaveAttribute("data-form-draft-check", "original");
  });
}
