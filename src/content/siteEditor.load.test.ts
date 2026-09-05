import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublishedSiteContent, seedPublicSiteContent } from "./siteEditor";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public content availability", () => {
  it("aborts a stalled request and resolves compiled content within ten seconds", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      requestSignal = options.signal as AbortSignal;
      requestSignal?.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")));
    })));
    const resolved = vi.fn();
    void loadPublishedSiteContent("/about").then(resolved);
    await vi.advanceTimersByTimeAsync(10_000);

    expect(resolved).toHaveBeenCalledWith(seedPublicSiteContent());
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the deadline after a completed request", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => [] })));

    expect(await loadPublishedSiteContent("/about")).toEqual(seedPublicSiteContent());
    expect(vi.getTimerCount()).toBe(0);
  });
});
