// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { setAnalyticsConsent } from "./analytics";
import { loadPublishedSiteContent, seedPublicSiteContent } from "./content/siteEditor";

vi.mock("./content/siteEditor", async (importOriginal) => ({
  ...await importOriginal<typeof import("./content/siteEditor")>(),
  loadPublishedSiteContent: vi.fn(),
}));

describe("public page navigation and content refresh", () => {
  beforeEach(() => {
    const values = new Map([["analytics-consent", "denied"], ["site-theme", "light"]]);
    Object.defineProperty(window, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    window.history.replaceState({}, "", "/atlantic-county");
    vi.stubGlobal("scrollTo", vi.fn());
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(seedPublicSiteContent());
  });

  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it("keeps the reading position when published content arrives late", async () => {
    let resolveContent!: (value: ReturnType<typeof seedPublicSiteContent>) => void;
    vi.mocked(loadPublishedSiteContent).mockReturnValueOnce(new Promise((resolve) => { resolveContent = resolve; }));
    render(<App />);
    vi.mocked(window.scrollTo).mockClear();
    await act(async () => { resolveContent(structuredClone(seedPublicSiteContent())); });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("keeps expanded towns when changing theme", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(loadPublishedSiteContent).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("button", { name: "Collapse Absecon details" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(screen.getByRole("button", { name: "Collapse Absecon details" })).toBeVisible();
  });

  it("keeps all towns expanded after opening a shared town and changing theme", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(loadPublishedSiteContent).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Expand Absecon details" }));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(screen.getByRole("button", { name: "Collapse Atlantic City details" })).toBeVisible();
  });

  it("preserves query and town anchor when following an internal edited link", async () => {
    const content = structuredClone(seedPublicSiteContent());
    content.sitewide.footer.linkGroups[0].links.push({ label: "Visit Wildwood", path: "/cape-may-county?utm_source=guide#wildwood" });
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(content);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("link", { name: "Visit Wildwood" }));
    expect(window.location.pathname).toBe("/cape-may-county");
    expect(window.location.search).toBe("?utm_source=guide");
    expect(window.location.hash).toBe("#wildwood");
    expect(await screen.findByRole("button", { name: "Collapse Wildwood details" })).toBeVisible();
  });

  it("scrolls to an internal fragment again when its URL is already current", async () => {
    const content = structuredClone(seedPublicSiteContent());
    content.sitewide.footer.linkGroups[0].links.push({ label: "Visit Absecon", path: "/atlantic-county#absecon" });
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(content);
    const user = userEvent.setup();
    render(<App />);
    const link = await screen.findByRole("link", { name: "Visit Absecon" });
    await user.click(link);
    await act(async () => { await new Promise((resolve) => window.requestAnimationFrame(resolve)); });
    vi.mocked(Element.prototype.scrollIntoView).mockClear();
    await user.click(link);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});

const communityOpenEvents = () => (window.dataLayer || [])
  .map((entry) => Array.from(entry as ArrayLike<unknown>))
  .filter((entry) => entry[0] === "event" && entry[1] === "community_profile_open");

describe("consented community profile measurement", () => {
  beforeEach(() => {
    const values = new Map([["site-theme", "light"]]);
    Object.defineProperty(window, "localStorage", { configurable: true, value: {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, String(value)),
    } });
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/atlantic-county");
    setAnalyticsConsent("denied");
    vi.stubGlobal("scrollTo", vi.fn());
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(structuredClone(seedPublicSiteContent()));
  });

  afterEach(() => {
    cleanup();
    setAnalyticsConsent("denied");
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("counts an individually opened town once while preserving accordion and bulk controls", async () => {
    setAnalyticsConsent("granted");
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(loadPublishedSiteContent).toHaveBeenCalled());

    await user.click(screen.getByRole("heading", { name: "Atlantic City" }));
    expect(screen.getByRole("button", { name: "Collapse Atlantic City details" })).toHaveAttribute("aria-expanded", "true");
    expect(window.location.hash).toBe("#atlantic-city");
    expect(communityOpenEvents()).toEqual([
      ["event", "community_profile_open", expect.objectContaining({
        county_id: "atlantic", community_id: "atlantic-city", open_method: "manual",
      })],
    ]);

    await user.click(screen.getByRole("button", { name: "Collapse Atlantic City details" }));
    expect(window.location.hash).toBe("");
    await user.click(screen.getByRole("button", { name: "Expand Atlantic City details" }));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("button", { name: "Collapse Absecon details" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(screen.getByRole("button", { name: "Collapse Absecon details" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.getByRole("button", { name: "Expand Atlantic City details" })).toHaveAttribute("aria-expanded", "false");
    expect(communityOpenEvents()).toHaveLength(1);
  });

  it("counts anchor entry once through Strict Mode, content refresh, and hash history events", async () => {
    window.history.replaceState({}, "", "/atlantic-county#atlantic-city");
    setAnalyticsConsent("granted");
    let resolveContent!: (value: ReturnType<typeof seedPublicSiteContent>) => void;
    const contentRequest = new Promise<ReturnType<typeof seedPublicSiteContent>>((resolve) => { resolveContent = resolve; });
    vi.mocked(loadPublishedSiteContent).mockReturnValue(contentRequest);
    render(<StrictMode><App /></StrictMode>);
    expect(screen.getByRole("button", { name: "Collapse Atlantic City details" })).toBeVisible();
    expect(communityOpenEvents()).toEqual([
      ["event", "community_profile_open", expect.objectContaining({
        county_id: "atlantic", community_id: "atlantic-city", open_method: "anchor",
      })],
    ]);

    await act(async () => { resolveContent(structuredClone(seedPublicSiteContent())); });
    act(() => {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(communityOpenEvents()).toHaveLength(1);

    act(() => {
      window.history.pushState({}, "", "/atlantic-county#absecon");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByRole("button", { name: "Collapse Absecon details" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Expand Atlantic City details" })).toBeVisible();
    expect(communityOpenEvents()).toHaveLength(2);
    expect(communityOpenEvents().at(-1)).toEqual([
      "event", "community_profile_open", expect.objectContaining({
        county_id: "atlantic", community_id: "absecon", open_method: "anchor",
      }),
    ]);
  });

  it.each(["manual", "anchor"] as const)("does not replay a pre-consent %s opening on opt-in or theme changes", async (method) => {
    if (method === "anchor") window.history.replaceState({}, "", "/atlantic-county#atlantic-city");
    const content = seedPublicSiteContent();
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(loadPublishedSiteContent).toHaveBeenCalled());
    if (method === "manual") await user.click(screen.getByRole("button", { name: "Expand Atlantic City details" }));
    expect(screen.getByRole("button", { name: "Collapse Atlantic City details" })).toBeVisible();
    expect(window.dataLayer).toBeUndefined();

    await user.click(screen.getByRole("button", { name: content.sitewide.footer.cookieSettingsLabel }));
    await user.click(screen.getByRole("button", { name: content.sitewide.privacyBanner.acceptLabel }));
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(communityOpenEvents()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Collapse Atlantic City details" }));
    await user.click(screen.getByRole("button", { name: "Expand Atlantic City details" }));
    expect(communityOpenEvents()).toEqual([
      ["event", "community_profile_open", expect.objectContaining({
        county_id: "atlantic", community_id: "atlantic-city", open_method: "manual",
      })],
    ]);
  });

  it("uses the verified town identity when published headings are edited", async () => {
    window.history.replaceState({}, "", "/camden-county");
    const content = structuredClone(seedPublicSiteContent());
    const camden = content.pages.get("/camden-county")!;
    camden.page.title = "An edited county heading";
    const town = camden.page.sections.find((section) => section.blocks[0]?.text === "Camden City")!;
    town.blocks[0].text = "Camden property information";
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(content);
    setAnalyticsConsent("granted");
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Expand Camden property information details" }));

    expect(communityOpenEvents()).toEqual([
      ["event", "community_profile_open", expect.objectContaining({
        county_id: "camden", community_id: "camden-city", open_method: "manual",
      })],
    ]);
    expect(JSON.stringify(communityOpenEvents())).not.toContain("Camden property information");
  });

  it("counts a fresh opening after leaving the county and returning", async () => {
    const content = structuredClone(seedPublicSiteContent());
    content.sitewide.footer.linkGroups[0].links.push({ label: "Return to Atlantic City", path: "/atlantic-county#atlantic-city" });
    vi.mocked(loadPublishedSiteContent).mockResolvedValue(content);
    setAnalyticsConsent("granted");
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Expand Atlantic City details" }));
    expect(communityOpenEvents()).toHaveLength(1);

    await user.click(screen.getByRole("link", { name: "Return to Atlantic City" }));
    expect(communityOpenEvents()).toHaveLength(1);
    await user.click(screen.getAllByRole("link", { name: "Contact" })[0]);
    expect(window.location.pathname).toBe("/contact");
    await user.click(await screen.findByRole("link", { name: "Return to Atlantic City" }));
    expect(screen.getByRole("button", { name: "Collapse Atlantic City details" })).toBeVisible();
    expect(communityOpenEvents()).toHaveLength(2);
  });
});
