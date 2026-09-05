import { describe, expect, it, vi } from "vitest";
import { loadPublishedBuildRows, requiresPublishedBuildContent } from "./prerenderContent";

const configured = {
  VITE_SUPABASE_URL: "https://fixture.invalid",
  VITE_SUPABASE_PUBLISHABLE_KEY: "fixture-public-key",
};
const production = { ...configured, CF_PAGES: "1", CF_PAGES_BRANCH: "main" };
const rows = [{ page_key: "/", published_at: "2026-09-04T00:00:00Z", published_content: { page: { title: "Published title" } } }];

describe("published build content", () => {
  it("returns the actual published rows with a bounded request", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(rows));
    await expect(loadPublishedBuildRows({ environment: production, fetcher })).resolves.toEqual(rows);
    const [url, init] = fetcher.mock.calls[0];
    expect(new URL(url).searchParams.get("published_at")).toBe("not.is.null");
    expect(init.headers).toEqual({ apikey: configured.VITE_SUPABASE_PUBLISHABLE_KEY });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each(["HTTP error", "network error", "malformed JSON", "wrong shape"])("fails a production build on %s", async (failure) => {
    const fetcher = vi.fn();
    if (failure === "HTTP error") fetcher.mockResolvedValue(new Response("Unavailable", { status: 503 }));
    if (failure === "network error") fetcher.mockRejectedValue(new Error("Connection failed"));
    if (failure === "malformed JSON") fetcher.mockResolvedValue(new Response("invalid json"));
    if (failure === "wrong shape") fetcher.mockResolvedValue(Response.json({ error: "Unexpected response" }));
    await expect(loadPublishedBuildRows({ environment: production, fetcher })).rejects.toThrow("published content");
  });

  it("rejects malformed rows instead of silently replacing production content", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json([{ page_key: "/", published_content: null }]));
    await expect(loadPublishedBuildRows({ environment: production, fetcher })).rejects.toThrow("published content");
  });

  it("requires production configuration and forbids an offline production deployment", async () => {
    const fetcher = vi.fn();
    await expect(loadPublishedBuildRows({ environment: { CF_PAGES: "1", CF_PAGES_BRANCH: "main" }, fetcher })).rejects.toThrow("configuration");
    await expect(loadPublishedBuildRows({ environment: { ...production, SJRE_PRERENDER_OFFLINE: "1" }, fetcher })).rejects.toThrow("offline");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps no-config local builds and explicit preview fixtures offline", async () => {
    const fetcher = vi.fn();
    await expect(loadPublishedBuildRows({ environment: {}, fetcher })).resolves.toEqual([]);
    await expect(loadPublishedBuildRows({ environment: { ...configured, CF_PAGES: "1", CF_PAGES_BRANCH: "codex/preview", SJRE_PRERENDER_OFFLINE: "1" }, fetcher })).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("retains a visible fallback warning for local configured builds", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Connection failed"));
    const warn = vi.fn();
    await expect(loadPublishedBuildRows({ environment: configured, fetcher, warn })).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("compiled fallback"));
  });

  it("reads local Vite configuration without mistaking Vite production mode for Pages", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(rows));
    await expect(loadPublishedBuildRows({ environment: { NODE_ENV: "production" }, localEnvironment: configured, fetcher })).resolves.toEqual(rows);
    expect(requiresPublishedBuildContent({ NODE_ENV: "production" })).toBe(false);
    expect(requiresPublishedBuildContent(production)).toBe(true);
  });
});
