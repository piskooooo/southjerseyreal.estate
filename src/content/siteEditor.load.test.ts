import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublishedSiteContent, seedPublicSiteContent, SITEWIDE_CONTENT_KEY } from "./siteEditor";

const countyPaths = [
  "/atlantic-county",
  "/burlington-county",
  "/camden-county",
  "/cape-may-county",
  "/cumberland-county",
  "/gloucester-county",
  "/salem-county",
];

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("public content availability", () => {
  it("loads the Counties hub, sitewide content, and all seven county documents in one request", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
    const fetchContent = vi.fn(async (_url: string) => ({ ok: true, json: async () => [] }));
    vi.stubGlobal("fetch", fetchContent);

    expect(await loadPublishedSiteContent("/counties")).toEqual(seedPublicSiteContent());

    expect(fetchContent).toHaveBeenCalledTimes(1);
    const query = new URL(fetchContent.mock.calls[0][0]).searchParams;
    expect(query.get("page_key")).toBe(`in.(${[SITEWIDE_CONTENT_KEY, "/counties", ...countyPaths].join(",")})`);
    expect(query.get("select")).toBe("page_key,published_content,published_at");
    expect(query.get("published_at")).toBe("not.is.null");
  });

  it("accepts published hub and county edits while preserving removed towns and renamed headings", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
    const published = structuredClone(seedPublicSiteContent());
    published.sitewide.header.countiesLabel = "Browse county guides";
    published.pages.get("/counties")!.page.title = "Published county directory";
    const edits = countyPaths.map((path) => {
      const document = published.pages.get(path)!;
      const towns = document.page.sections.filter((section) => section.kind === "town");
      const firstTown = towns[0];
      const removedTown = towns.at(-1)!;
      const heading = `${firstTown.blocks[0].text} — revised town heading`;
      firstTown.blocks[0].text = heading;
      document.page.title = `Published ${document.page.title}`;
      document.page.sections = document.page.sections.filter((section) => section.id !== removedTown.id);
      return { path, firstId: firstTown.id, removedId: removedTown.id, heading, count: towns.length - 1 };
    });
    const rows = [
      { page_key: SITEWIDE_CONTENT_KEY, published_content: published.sitewide },
      ...["/counties", ...countyPaths].map((path) => ({
        page_key: path,
        published_content: published.pages.get(path),
      })),
    ].map((row) => ({ ...row, published_at: "2026-10-17T12:00:00Z" }));
    const fetchContent = vi.fn(async () => ({ ok: true, json: async () => rows }));
    vi.stubGlobal("fetch", fetchContent);

    const result = await loadPublishedSiteContent("/counties");

    expect(fetchContent).toHaveBeenCalledTimes(1);
    expect(result.sitewide.header.countiesLabel).toBe("Browse county guides");
    expect(result.pages.get("/counties")!.page.title).toBe("Published county directory");
    for (const edit of edits) {
      const page = result.pages.get(edit.path)!.page;
      expect(page.title).toBe(published.pages.get(edit.path)!.page.title);
      expect(page.sections.filter((section) => section.kind === "town")).toHaveLength(edit.count);
      expect(page.sections.some((section) => section.id === edit.removedId)).toBe(false);
      expect(page.sections.find((section) => section.id === edit.firstId)!.blocks[0].text).toBe(edit.heading);
    }
  });

  it.each(["/about", "/camden-county", "/insights/new-jersey-homebuying-process"])(
    "keeps the published-content request limited to sitewide and the current route for %s",
    async (path) => {
      vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");
      vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
      const fetchContent = vi.fn(async (_url: string) => ({ ok: true, json: async () => [] }));
      vi.stubGlobal("fetch", fetchContent);

      await loadPublishedSiteContent(path);

      expect(fetchContent).toHaveBeenCalledTimes(1);
      expect(new URL(fetchContent.mock.calls[0][0]).searchParams.get("page_key"))
        .toBe(`in.(${SITEWIDE_CONTENT_KEY},${path})`);
    },
  );

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
