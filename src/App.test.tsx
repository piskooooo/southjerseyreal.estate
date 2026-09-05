// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
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
