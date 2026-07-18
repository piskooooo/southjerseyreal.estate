import { createClient } from "npm:@supabase/supabase-js@2.110.6";

const ALLOWED_ORIGINS = new Set([
  "https://southjerseyreal-estate.pages.dev",
  "https://southjerseyreal.estate",
  "https://www.southjerseyreal.estate",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const CLOUDFLARE_DEPLOY_HOOK_PATH =
  /^\/client\/v4\/pages\/webhooks\/deploy_hooks\/[A-Za-z0-9_-]+\/?$/;

class ConfigurationError extends Error {}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new ConfigurationError(`Missing ${name}.`);
  return value;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const url = new URL(origin);
    return url.protocol === "https:" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      url.hostname.endsWith(".southjerseyreal-estate.pages.dev");
  } catch {
    return false;
  }
}

function responseHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(
  origin: string | null,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function userClient(authorization: string) {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cloudflareDeployHook(): URL {
  let hook: URL;
  try {
    hook = new URL(env("CLOUDFLARE_PAGES_DEPLOY_HOOK_URL"));
  } catch {
    throw new ConfigurationError(
      "The Cloudflare Pages deploy hook URL is invalid.",
    );
  }
  const valid = hook.protocol === "https:" &&
    hook.hostname === "api.cloudflare.com" &&
    hook.port === "" &&
    hook.username === "" &&
    hook.password === "" &&
    hook.search === "" &&
    hook.hash === "" &&
    CLOUDFLARE_DEPLOY_HOOK_PATH.test(hook.pathname);
  if (!valid) {
    throw new ConfigurationError(
      "The Cloudflare Pages deploy hook URL is invalid.",
    );
  }
  return hook;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return isAllowedOrigin(origin)
      ? new Response(null, { status: 204, headers: responseHeaders(origin) })
      : json(null, { error: "Origin not allowed." }, 403);
  }

  if (request.method !== "POST") {
    return json(origin, { error: "Method not allowed." }, 405);
  }

  if (origin && !isAllowedOrigin(origin)) {
    return json(null, { error: "Origin not allowed." }, 403);
  }

  try {
    const authorization = request.headers.get("authorization")?.trim() || "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return json(origin, { error: "Authentication required." }, 401);
    }

    const client = userClient(authorization);
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      return json(origin, { error: "Authentication required." }, 401);
    }

    const { data: isAdmin, error: adminError } = await client.rpc(
      "is_site_admin",
    );
    if (adminError || isAdmin !== true) {
      return json(origin, { error: "Administrator access required." }, 403);
    }

    const hookResponse = await fetch(cloudflareDeployHook(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "south-jersey-website-editor" }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!hookResponse.ok) {
      throw new Error(
        `Cloudflare rejected the rebuild request (${hookResponse.status}).`,
      );
    }

    return json(
      origin,
      {
        accepted: true,
        queued: true,
        message: "The website rebuild has been queued.",
      },
      202,
    );
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("Site rebuild configuration error.");
      return json(
        origin,
        { error: "The rebuild service is not configured." },
        503,
      );
    }

    console.error(
      "Site rebuild failed.",
      error instanceof Error ? error.message : error,
    );
    return json(
      origin,
      { error: "The site rebuild could not be queued." },
      502,
    );
  }
});
