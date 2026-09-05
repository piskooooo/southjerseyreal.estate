type BuildEnvironment = Record<string, string | undefined>;
type PublishedBuildRow = Record<string, unknown> & {
  page_key: string;
  published_content: Record<string, unknown>;
  published_at: string;
};

// The repository's supported Pages production branch is main.
export const requiresPublishedBuildContent = (environment: BuildEnvironment) =>
  environment.CF_PAGES === "1" && environment.CF_PAGES_BRANCH === "main";

export async function loadPublishedBuildRows({
  environment,
  localEnvironment = {},
  fetcher = fetch,
  warn = console.warn,
}: {
  environment: BuildEnvironment;
  localEnvironment?: BuildEnvironment;
  fetcher?: typeof fetch;
  warn?: (message: string) => void;
}): Promise<PublishedBuildRow[]> {
  const required = requiresPublishedBuildContent(environment);
  if (environment.SJRE_PRERENDER_OFFLINE === "1") {
    if (required) throw new Error("Pages production cannot build SEO with offline content.");
    return [];
  }

  const supabaseUrl = String(environment.VITE_SUPABASE_URL || localEnvironment.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publishableKey = String(environment.VITE_SUPABASE_PUBLISHABLE_KEY || localEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!supabaseUrl || !publishableKey) {
    if (required) throw new Error("Pages production requires published content configuration (Supabase URL and publishable key).");
    return [];
  }

  try {
    const query = new URLSearchParams({ select: "page_key,published_content,published_at", published_at: "not.is.null" });
    const response = await fetcher(`${supabaseUrl}/rest/v1/site_pages?${query}`, {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object"
      || typeof row.page_key !== "string" || !row.page_key
      || !row.published_content || typeof row.published_content !== "object" || Array.isArray(row.published_content)
      || typeof row.published_at !== "string" || !row.published_at)) {
      throw new Error("Unexpected published content response.");
    }
    if (required && rows.length === 0) {
      warn("Pages production returned no published content rows; SEO prerender is using compiled seeds.");
    }
    return rows as PublishedBuildRow[];
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Request failed";
    if (required) throw new Error(`Pages production could not load published content: ${detail}`);
    warn(`SEO prerender is using compiled fallback content: ${detail}`);
    return [];
  }
}
