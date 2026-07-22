import { createClient } from "npm:@supabase/supabase-js@2.110.6";
import { normalizePlacesResponse } from "./normalize.ts";

const GOOGLE_PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";
const GOOGLE_FIELD_MASK = [
  "attributions",
  "rating",
  "userRatingCount",
  "googleMapsLinks",
  "reviews",
].join(",");
const DAILY_GOOGLE_REQUEST_LIMIT = 30;

const DEFAULT_ALLOWED_ORIGINS = [
  "https://southjerseyreal-estate.pages.dev",
  "https://southjerseyreal.estate",
  "https://www.southjerseyreal.estate",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

class ConfigurationError extends Error {}
class DailyQuotaError extends Error {}

type DailyQuotaClaim = {
  accepted?: boolean;
  requestCount?: number;
  limit?: number;
};

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new ConfigurationError(`Missing ${name}.`);
  return value;
}

function commaSeparatedEnv(name: string, fallback: string[]): Set<string> {
  const configured = Deno.env.get(name)?.split(",") ?? fallback;
  return new Set(configured.map((value) => value.trim()).filter(Boolean));
}

function getSupabaseSecretKey(): string {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (legacyKey) return legacyKey;

  const encodedKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (encodedKeys) {
    try {
      const keys = JSON.parse(encodedKeys) as Record<string, unknown>;
      const defaultKey = keys.default;
      if (typeof defaultKey === "string" && defaultKey) return defaultKey;
      const firstKey = Object.values(keys).find((value) =>
        typeof value === "string" && value
      );
      if (typeof firstKey === "string") return firstKey;
    } catch {
      throw new ConfigurationError("SUPABASE_SECRET_KEYS is not valid JSON.");
    }
  }
  throw new ConfigurationError("Missing a Supabase secret key.");
}

function createAdminClient() {
  return createClient(env("SUPABASE_URL"), getSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function claimDailyGoogleRequest(): Promise<void> {
  const { data, error } = await createAdminClient().rpc(
    "claim_google_review_daily_request",
    { p_limit: DAILY_GOOGLE_REQUEST_LIMIT },
  );
  if (error) throw new Error("The Google review quota could not be claimed.");

  const claim = data as DailyQuotaClaim | null;
  if (!claim?.accepted) throw new DailyQuotaError("Daily Google review quota exhausted.");
}

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "accept",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(
  origin: string | null,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

function googlePlaceId(): string {
  const placeId = env("GOOGLE_PLACE_ID");
  if (!/^[A-Za-z0-9_-]{10,255}$/.test(placeId)) {
    throw new ConfigurationError("GOOGLE_PLACE_ID is invalid.");
  }
  return placeId;
}

async function fetchGoogleReviews(): Promise<
  ReturnType<typeof normalizePlacesResponse>
> {
  const placeId = googlePlaceId();
  const endpoint = new URL(
    `${GOOGLE_PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`,
  );
  endpoint.searchParams.set("languageCode", "en");
  endpoint.searchParams.set("regionCode", "US");

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Goog-Api-Key": env("GOOGLE_PLACES_API_KEY"),
      "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    console.error(`Google Places request failed with HTTP ${response.status}.`);
    throw new Error("Google Places request failed.");
  }

  return normalizePlacesResponse(await response.json());
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigins = commaSeparatedEnv(
    "REVIEWS_ALLOWED_ORIGINS",
    DEFAULT_ALLOWED_ORIGINS,
  );
  const allowedOrigin = requestOrigin && allowedOrigins.has(requestOrigin)
    ? requestOrigin
    : null;

  if (!requestOrigin || !allowedOrigin) {
    return jsonResponse(null, {
      ok: false,
      code: "origin_not_allowed",
      message: "Origin is not allowed.",
    }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(allowedOrigin),
    });
  }

  if (request.method !== "GET") {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "method_not_allowed",
      message: "Method not allowed.",
    }, 405);
  }

  try {
    await claimDailyGoogleRequest();
    const feed = await fetchGoogleReviews();
    return jsonResponse(allowedOrigin, { ok: true, ...feed });
  } catch (error) {
    const configurationError = error instanceof ConfigurationError;
    const quotaError = error instanceof DailyQuotaError;
    if (configurationError) console.error(error.message);
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: configurationError
        ? "configuration_error"
        : quotaError
        ? "daily_quota_exhausted"
        : "provider_unavailable",
      message: "Google reviews are temporarily unavailable.",
    }, quotaError ? 429 : 503);
  }
});
