import { expect, test, type Locator, type Page } from "@playwright/test";

// Browser plugin not available; use the repository's configured Playwright browser.
const counties = [
  ["atlantic", 23],
  ["burlington", 40],
  ["camden", 34],
  ["cape-may", 16],
  ["cumberland", 14],
  ["gloucester", 24],
  ["salem", 15],
] as const;

async function preparePage(page: Page, consent: "granted" | "denied" | null = "denied") {
  await page.addInitScript((value) => {
    if (value) localStorage.setItem("analytics-consent", value);
    else localStorage.removeItem("analytics-consent");
    localStorage.setItem("site-theme", "light");
  }, consent);
  await page.route("**/rest/v1/site_pages?*", (route) => route.fulfill({
    contentType: "application/json", body: "[]",
  }));
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({
    contentType: "application/javascript", body: "",
  }));
}

async function openCounty(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-seo-prerendered="true"]')).toHaveCount(0);
  await expect(page.locator(".town-grid-toolbar details.town-directory")).toHaveCount(1);
}

async function analyticsEvents(page: Page, name: string) {
  return page.evaluate((eventName) => (window.dataLayer || [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "event" && entry[1] === eventName), name);
}

async function directoryLinks(directory: Locator) {
  return directory.getByRole("navigation", { name: "Town directory" }).locator("a").evaluateAll(
    (links) => links.map((link) => ({
      title: link.textContent?.replace(/\s+/g, " ").trim(),
      href: link.getAttribute("href"),
    })),
  );
}

async function profileDestinations(profiles: Locator) {
  return profiles.evaluateAll((articles) => articles.map((article) => ({
    title: article.querySelector(".town-card-summary h2, .town-card-summary h3, .town-card-summary h4")?.textContent?.replace(/\s+/g, " ").trim(),
    href: `#${article.id}`,
  })));
}

async function jumpTo(page: Page, title: string, keyboard = false) {
  const directory = page.locator(".town-grid-toolbar details.town-directory");
  const summary = directory.locator("summary");
  if (keyboard) {
    await summary.focus();
    await page.keyboard.press("Enter");
  } else {
    await summary.click();
  }
  await expect(directory).toHaveAttribute("open", "");
  const link = directory.getByRole("link", { name: title, exact: true });
  if (keyboard) {
    await link.focus();
    await page.keyboard.press("Enter");
  } else {
    await link.click();
  }
  await expect(directory).not.toHaveAttribute("open", "");
}

for (const [county, count] of counties) {
  test(`${county} has an ordered native town directory before and after JavaScript`, async ({ browser, page, baseURL }) => {
    const noScript = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const initial = await noScript.newPage();
      await initial.goto(`/${county}-county`, { waitUntil: "domcontentloaded" });
      const initialDirectory = initial.locator("details.town-directory");
      await expect(initialDirectory).toHaveCount(1);
      await expect(initialDirectory.locator("summary")).toHaveText("Jump to a town");
      await expect(initialDirectory).not.toHaveAttribute("open", "");
      await initialDirectory.locator("summary").click();
      const links = await directoryLinks(initialDirectory);
      expect(links).toHaveLength(count);
      expect(links).toEqual(await profileDestinations(initial.locator("article.prerendered-community-profile")));
      const lastLink = initialDirectory.getByRole("link").last();
      const lastHref = await lastLink.getAttribute("href");
      await lastLink.click();
      expect(new URL(initial.url()).hash).toBe(lastHref);
      await expect(initial.locator(`article[id="${lastHref!.slice(1)}"]`)).toBeInViewport();
      await expect(initial.getByRole("button", { name: /^Copy link to / })).toHaveCount(0);

      await preparePage(page);
      await openCounty(page, `/${county}-county`);
      const directory = page.locator(".town-grid-toolbar details.town-directory");
      await expect(directory.locator("summary")).toHaveText("Jump to a town");
      await expect(directory).not.toHaveAttribute("open", "");
      await directory.locator("summary").click();
      expect(await directoryLinks(directory)).toEqual(links);
      expect(await directoryLinks(directory)).toEqual(await profileDestinations(page.locator("article.town-card")));
    } finally {
      await noScript.close();
    }
  });
}

test("keyboard town jumps focus the profile, preserve queries, and support repeated jumps and history", async ({ page }) => {
  await preparePage(page, "granted");
  await page.setViewportSize({ width: 390, height: 844 });
  await openCounty(page, "/camden-county?utm_source=codex_test&utm_medium=qa");
  const query = new URL(page.url()).search;

  await jumpTo(page, "Camden City", true);
  await expect(page).toHaveURL(`/camden-county${query}#camden-city`);
  await expect(page.locator("article#camden-city")).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("article#camden-city")).toBeFocused();
  await expect(page.locator("#camden-city .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#camden-city .town-card-summary h3")).toBeInViewport();

  await jumpTo(page, "Cherry Hill", true);
  await expect(page).toHaveURL(`/camden-county${query}#cherry-hill`);
  await expect(page.locator("article#cherry-hill")).toBeFocused();
  await jumpTo(page, "Cherry Hill", true);
  await expect(page.locator("article#cherry-hill")).toBeFocused();
  await expect(page.locator("#cherry-hill .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: /^Copy link to / })).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(`/camden-county${query}#camden-city`);
  await expect(page.locator("#camden-city .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  await page.goForward();
  await expect(page).toHaveURL(`/camden-county${query}#cherry-hill`);
  await expect(page.locator("#cherry-hill .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([
    ["event", "community_profile_open", expect.objectContaining({ county_id: "camden", community_id: "camden-city", open_method: "anchor" })],
    ["event", "community_profile_open", expect.objectContaining({ county_id: "camden", community_id: "cherry-hill", open_method: "anchor" })],
  ]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});

test("tablet town profiles keep full-width editorial rows and the directory stays within the viewport", async ({ page }) => {
  await preparePage(page);
  const targetTitle = "Hamilton Township (Mays Landing)";
  const target = page.locator("article#hamilton-township-mays-landing");

  const expectFullWidthProfiles = async () => {
    const widths = await page.locator(".town-card-grid").evaluate((grid) => {
      const gridWidth = grid.getBoundingClientRect().width;
      return Array.from(grid.querySelectorAll("article.town-card"), (article) => ({
        anchor: article.id,
        difference: Math.abs(article.getBoundingClientRect().width - gridWidth),
      }));
    });
    expect(widths).toHaveLength(23);
    expect(widths.filter(({ difference }) => difference > 1)).toEqual([]);
  };
  const expectContainedHeading = async () => {
    const contained = await target.evaluate((article) => {
      const heading = article.querySelector<HTMLElement>(".town-card-summary h3");
      const body = article.querySelector<HTMLElement>(".town-card-body");
      if (!heading || !body) throw new Error("Town heading or body is missing");
      const headingRect = heading.getBoundingClientRect();
      const containsHeading = (element: Element) => {
        const bounds = element.getBoundingClientRect();
        return headingRect.left >= bounds.left - 1 && headingRect.right <= bounds.right + 1
          && headingRect.top >= bounds.top - 1 && headingRect.bottom <= bounds.bottom + 1;
      };
      return {
        insideBody: containsHeading(body),
        insideCard: containsHeading(article),
        textFits: heading.scrollWidth <= heading.clientWidth + 1,
      };
    });
    expect(contained).toEqual({ insideBody: true, insideCard: true, textFits: true });
  };

  for (const width of [768, 820, 980]) {
    await page.setViewportSize({ width, height: 1024 });
    await openCounty(page, "/atlantic-county");
    await expectFullWidthProfiles();
    await expectContainedHeading();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

    const directory = page.locator(".town-grid-toolbar details.town-directory");
    await directory.locator("summary").click();
    const menuBounds = await directory.getByRole("navigation", { name: "Town directory" }).evaluate((menu) => {
      const bounds = menu.getBoundingClientRect();
      return {
        insideViewport: bounds.left >= -1 && bounds.right <= window.innerWidth + 1
          && bounds.top >= -1 && bounds.bottom <= window.innerHeight + 1,
      };
    });
    expect(menuBounds.insideViewport).toBe(true);
    await directory.getByRole("link", { name: targetTitle, exact: true }).click();
    await expect(directory).not.toHaveAttribute("open", "");
    await expect(target.locator(".town-card-indicator")).toHaveAttribute("aria-expanded", "true");
    await expectFullWidthProfiles();
    await expectContainedHeading();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});

for (const width of [1440, 390, 320]) {
  test(`sticky county controls stay usable at ${width}px in both themes and release at the county boundary`, async ({ page }) => {
    await preparePage(page);
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const expectHeadingClear = async (anchor: string) => {
      await expect.poll(() => page.locator(`#${anchor} .town-card-summary h3`).evaluate((heading) => {
        const headingTop = heading.getBoundingClientRect().top;
        const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
        const toolbarBottom = document.querySelector(".town-grid-toolbar")!.getBoundingClientRect().bottom;
        return headingTop >= Math.max(headerBottom, toolbarBottom) - 1 && headingTop < window.innerHeight;
      })).toBe(true);
    };

    for (const theme of ["light", "dark"] as const) {
      await openCounty(page, "/atlantic-county");
      if (theme === "dark") await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      const toolbar = page.locator(".town-grid-toolbar");
      const directory = toolbar.locator("details.town-directory");
      const expandAll = toolbar.getByRole("button", { name: "Expand all", exact: true });
      const collapseAll = toolbar.getByRole("button", { name: "Collapse all", exact: true });
      await expect(expandAll).toBeVisible();
      await expect(collapseAll).toBeVisible();
      expect(await toolbar.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
      expect(await toolbar.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
        return {
          startsBelowHeader: bounds.top > headerBottom + 1,
          fitsViewport: bounds.left >= -1 && bounds.right <= window.innerWidth + 1,
        };
      })).toEqual({ startsBelowHeader: true, fitsViewport: true });

      // Cross the toolbar's normal position so the check proves it follows scrolling.
      await toolbar.evaluate((element) => window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY + 200,
        behavior: "instant",
      }));
      await expect.poll(() => toolbar.evaluate((element) => {
        const header = document.querySelector(".site-header");
        if (!header) throw new Error("Site header is missing");
        const top = element.getBoundingClientRect().top;
        const headerBottom = header.getBoundingClientRect().bottom;
        return top >= headerBottom - 1 && top <= headerBottom + 1;
      })).toBe(true);
      expect(await toolbar.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
      })).toBe(true);

      await directory.locator("summary").click();
      const menu = directory.getByRole("navigation", { name: "Town directory" });
      await expect(menu).toBeVisible();
      expect(await menu.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
        const firstLink = element.querySelector("a")!;
        const linkBounds = firstLink.getBoundingClientRect();
        const hit = document.elementFromPoint(linkBounds.left + linkBounds.width / 2, linkBounds.top + linkBounds.height / 2);
        return {
          withinViewport: bounds.left >= -1 && bounds.right <= window.innerWidth + 1
            && bounds.top >= headerBottom - 1 && bounds.bottom <= window.innerHeight + 1,
          linksAreUncovered: Boolean(hit && firstLink.contains(hit)),
        };
      })).toEqual({ withinViewport: true, linksAreUncovered: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

      await menu.getByRole("link", { name: "Hamilton Township (Mays Landing)", exact: true }).click();
      await expect(directory).not.toHaveAttribute("open", "");
      await expect(page.locator("#hamilton-township-mays-landing .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
      await expectHeadingClear("hamilton-township-mays-landing");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

      if (width === 390) {
        // Reuse the rendered page so header/toolbar measurements must react to wrapping.
        await page.setViewportSize({ width: 320, height: 844 });
        await jumpTo(page, "Absecon");
        await expectHeadingClear("absecon");
        await page.goBack();
        await expect(page).toHaveURL(/#hamilton-township-mays-landing$/);
        await expectHeadingClear("hamilton-township-mays-landing");
        await page.goForward();
        await expect(page).toHaveURL(/#absecon$/);
        await expectHeadingClear("absecon");
        await page.setViewportSize({ width: 390, height: 844 });
        await jumpTo(page, "Hamilton Township (Mays Landing)");
        await expectHeadingClear("hamilton-township-mays-landing");
      }

      await expandAll.click();
      await expect(expandAll).toBeDisabled();
      await expect(collapseAll).toBeEnabled();
      await expect(page.locator('.town-card-indicator[aria-expanded="true"]')).toHaveCount(23);
      await collapseAll.click();
      await expect(collapseAll).toBeDisabled();
      await expect(expandAll).toBeEnabled();
      await expect(page.locator('.town-card-indicator[aria-expanded="true"]')).toHaveCount(0);
      await expect(toolbar).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

      // The toolbar belongs to the town section and must scroll away with its end.
      await page.locator(".town-grid-section").evaluate((section) => {
        const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
        window.scrollTo({
          top: section.getBoundingClientRect().bottom + window.scrollY - headerBottom + 32,
          behavior: "instant",
        });
      });
      await expect.poll(() => toolbar.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const sectionBottom = element.closest(".town-grid-section")!.getBoundingClientRect().bottom;
        const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
        return bounds.bottom <= sectionBottom + 1 && bounds.top < headerBottom - 1;
      })).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    }
  });
}

test("a town jump before consent is not replayed or attached to Contact after consent", async ({ page }) => {
  await preparePage(page, null);
  await openCounty(page, "/camden-county");
  await jumpTo(page, "Cherry Hill");
  await expect(page.locator("#cherry-hill .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([]);
  await page.getByRole("button", { name: "Accept Analytics", exact: true }).click();
  await expect(page.locator("#cherry-hill .town-card-indicator")).toHaveAttribute("aria-expanded", "true");
  expect(await analyticsEvents(page, "community_profile_open")).toEqual([]);
  await page.locator(".site-footer").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  const contactEvents = await analyticsEvents(page, "internal_link_click");
  expect(contactEvents).toEqual(expect.arrayContaining([
    ["event", "internal_link_click", expect.objectContaining({ link_url: "/contact" })],
  ]));
  for (const event of contactEvents) {
    expect(event[2]).not.toHaveProperty("community_id");
    expect(event[2]).not.toHaveProperty("county_id");
  }
});
