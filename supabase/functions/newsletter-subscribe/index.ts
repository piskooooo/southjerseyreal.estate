import { createClient } from "npm:@supabase/supabase-js@2.110.6";

const BREVO_DOI_ENDPOINT =
  "https://api.brevo.com/v3/contacts/doubleOptinConfirmation";
const TURNSTILE_SITEVERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "turnstile-spin-v2";
const SUCCESS_MESSAGE = "Check your email to confirm your subscription.";
const MAX_REQUEST_BYTES = 8_192;
const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://southjerseyreal-estate.pages.dev",
  "https://southjerseyreal.estate",
  "https://www.southjerseyreal.estate",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const DEFAULT_EXPECTED_HOSTNAMES = [
  "southjerseyreal-estate.pages.dev",
  "southjerseyreal.estate",
  "www.southjerseyreal.estate",
  "localhost",
  "127.0.0.1",
];

type SignupRequest = {
  email?: unknown;
  name?: unknown;
  county?: unknown;
  interest?: unknown;
  consent?: unknown;
  company?: unknown;
  turnstileToken?: unknown;
  source?: unknown;
};

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

type BrevoError = {
  code?: string;
  message?: string;
};

class ConfigurationError extends Error {}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new ConfigurationError(`Missing ${name}.`);
  return value;
}

function positiveIntegerEnv(name: string): number {
  const value = Number(env(name));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ConfigurationError(`${name} must be a positive integer.`);
  }
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

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
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

function normalizedLine(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(/\s+/g, " ");
  if (normalized.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }
  return normalized;
}

function normalizedEmail(value: unknown): string | null {
  const email = normalizedLine(value, 320)?.toLowerCase() || "";
  if (email.length < 3) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function clientIp(request: Request): string | null {
  const connectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (connectingIp) return connectingIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function parseRequest(request: Request): Promise<SignupRequest> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    throw new RangeError("Request body is too large.");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new RangeError("Request body is too large.");
  }

  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SyntaxError("Request body must be a JSON object.");
  }
  return parsed as SignupRequest;
}

async function verifyTurnstile(
  request: Request,
  token: string,
): Promise<boolean> {
  const payload = new URLSearchParams({
    secret: env("TURNSTILE_SECRET"),
    response: token,
    idempotency_key: crypto.randomUUID(),
  });
  const remoteIp = clientIp(request);
  if (remoteIp) payload.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_SITEVERIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error("Turnstile verification service was unavailable.");
  }

  const result = await response.json() as TurnstileResult;
  if (result.success !== true) return false;

  const expectedAction = Deno.env.get("NEWSLETTER_TURNSTILE_EXPECTED_ACTION")
    ?.trim() || TURNSTILE_ACTION;
  if (result.action !== expectedAction) return false;

  const expectedHostnames = commaSeparatedEnv(
    "TURNSTILE_EXPECTED_HOSTNAMES",
    DEFAULT_EXPECTED_HOSTNAMES,
  );
  return Boolean(result.hostname && expectedHostnames.has(result.hostname));
}

async function emailHash(email: string): Promise<string> {
  const auditKey = env("NEWSLETTER_AUDIT_HMAC_KEY");
  if (auditKey.length < 32) {
    throw new ConfigurationError(
      "NEWSLETTER_AUDIT_HMAC_KEY must be at least 32 characters.",
    );
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(auditKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(email),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function requestBrevoDoubleOptIn(
  email: string,
  attributes: Record<string, string>,
): Promise<{ accepted: boolean; duplicate: boolean; code: string | null }> {
  const redirectUrl = env("BREVO_DOI_REDIRECT_URL");
  try {
    const parsedRedirect = new URL(redirectUrl);
    if (parsedRedirect.protocol !== "https:") throw new Error();
  } catch {
    throw new ConfigurationError(
      "BREVO_DOI_REDIRECT_URL must be a valid HTTPS URL.",
    );
  }

  const response = await fetch(BREVO_DOI_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "api-key": env("BREVO_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      includeListIds: [positiveIntegerEnv("BREVO_NEWSLETTER_LIST_ID")],
      redirectionUrl: redirectUrl,
      templateId: positiveIntegerEnv("BREVO_DOI_TEMPLATE_ID"),
      ...(Object.keys(attributes).length ? { attributes } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (response.ok) return { accepted: true, duplicate: false, code: null };

  let error: BrevoError = {};
  try {
    error = await response.json() as BrevoError;
  } catch {
    // The bounded HTTP status is enough for the internal audit record.
  }
  const code = typeof error.code === "string"
    ? error.code.slice(0, 100)
    : `http_${response.status}`;
  const duplicate = code === "duplicate_parameter" ||
    code === "duplicate_request";
  return { accepted: false, duplicate, code };
}

async function updateAuditStatus(
  admin: ReturnType<typeof createAdminClient>,
  hashedEmail: string,
  attemptId: string,
  providerStatus:
    | "confirmation_requested"
    | "already_registered"
    | "provider_error",
  providerCode: string | null,
): Promise<void> {
  const { data, error } = await admin.rpc("complete_newsletter_signup_request", {
    p_email_hash: hashedEmail,
    p_attempt_id: attemptId,
    p_provider_status: providerStatus,
    p_provider_code: providerCode,
  });
  if (error || data !== true) {
    throw new Error("The newsletter audit status could not be updated.");
  }
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("origin");
  const allowedOrigins = commaSeparatedEnv(
    "NEWSLETTER_ALLOWED_ORIGINS",
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
  if (request.method !== "POST") {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "method_not_allowed",
      message: "Method not allowed.",
    }, 405);
  }

  let body: SignupRequest;
  try {
    body = await parseRequest(request);
  } catch (error) {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "invalid_request",
      message: error instanceof RangeError
        ? "The request is too large."
        : "Send a valid newsletter request.",
    }, error instanceof RangeError ? 413 : 400);
  }

  if (typeof body.company === "string" && body.company.trim()) {
    return jsonResponse(allowedOrigin, { ok: true, message: SUCCESS_MESSAGE });
  }

  const email = normalizedEmail(body.email);
  if (!email) {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "invalid_email",
      message: "Enter a valid email address.",
    }, 400);
  }
  const name = normalizedLine(body.name ?? "", 120);
  const county = normalizedLine(body.county ?? "", 80);
  const interest = normalizedLine(body.interest ?? "", 80);
  if (name === null || county === null || interest === null) {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "invalid_request",
      message: "Check the signup information and try again.",
    }, 400);
  }
  if (body.consent !== true) {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "consent_required",
      message: "Consent is required to subscribe.",
    }, 400);
  }
  if (body.source !== "newsletter_page") {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "invalid_source",
      message: "Invalid signup source.",
    }, 400);
  }
  if (
    typeof body.turnstileToken !== "string" ||
    !body.turnstileToken.trim() ||
    body.turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH
  ) {
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "turnstile_invalid",
      message: "Complete the security check and try again.",
    }, 400);
  }

  try {
    const turnstileValid = await verifyTurnstile(
      request,
      body.turnstileToken.trim(),
    );
    if (!turnstileValid) {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: "turnstile_invalid",
        message: "The security check expired. Please try again.",
      }, 403);
    }

    const admin = createAdminClient();
    const attemptId = crypto.randomUUID();
    const hashedEmail = await emailHash(email);
    const { data: shouldRequestConfirmation, error: auditError } = await admin.rpc(
      "begin_newsletter_signup_request",
      {
        p_email_hash: hashedEmail,
        p_source: body.source,
        p_attempt_id: attemptId,
      },
    );
    if (auditError) throw auditError;

    if (shouldRequestConfirmation !== true) {
      return jsonResponse(allowedOrigin, { ok: true, message: SUCCESS_MESSAGE });
    }

    const attributes: Record<string, string> = {};
    if (name) attributes.FIRSTNAME = name;
    if (county) attributes.SJ_COUNTY = county;
    if (interest) attributes.SJ_INTEREST = interest;

    let brevo: Awaited<ReturnType<typeof requestBrevoDoubleOptIn>>;
    try {
      brevo = await requestBrevoDoubleOptIn(email, attributes);
    } catch (providerError) {
      try {
        await updateAuditStatus(
          admin,
          hashedEmail,
          attemptId,
          "provider_error",
          "request_failed",
        );
      } catch (auditUpdateError) {
        console.error("Newsletter failure status could not be saved", {
          attemptId,
          message: auditUpdateError instanceof Error
            ? auditUpdateError.message
            : "Unknown error",
        });
      }
      throw providerError;
    }

    const providerStatus = brevo.accepted
      ? "confirmation_requested"
      : brevo.duplicate
      ? "already_registered"
      : "provider_error";

    try {
      await updateAuditStatus(
        admin,
        hashedEmail,
        attemptId,
        providerStatus,
        brevo.code,
      );
    } catch (auditUpdateError) {
      console.error("Newsletter completion status could not be saved", {
        attemptId,
        message: auditUpdateError instanceof Error
          ? auditUpdateError.message
          : "Unknown error",
      });
    }

    if (brevo.accepted || brevo.duplicate) {
      return jsonResponse(allowedOrigin, { ok: true, message: SUCCESS_MESSAGE });
    }

    console.error("Brevo DOI request failed", { attemptId, code: brevo.code });
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "provider_unavailable",
      message: "We could not start the confirmation email. Please try again shortly.",
    }, 502);
  } catch (error) {
    const configurationFailure = error instanceof ConfigurationError;
    console.error("Newsletter signup failed", {
      type: configurationFailure ? "configuration" : "service",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: configurationFailure ? "configuration_error" : "service_unavailable",
      message: "Newsletter signup is temporarily unavailable. Please try again shortly.",
    }, configurationFailure ? 503 : 502);
  }
});
