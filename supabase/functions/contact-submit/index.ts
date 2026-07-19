import { createClient } from "npm:@supabase/supabase-js@2.110.6";
import { BrevoTransactionalClient, BrevoTransactionalError } from "./brevo.ts";
import {
  type ContactNotificationWork,
  renderContactNotification,
} from "./render.ts";
import {
  CONTACT_TURNSTILE_ACTION,
  type ContactRequestBody,
  MAX_CONTACT_REQUEST_BYTES,
  validateContactRequest,
} from "./validation.ts";

const TURNSTILE_SITEVERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SUCCESS_MESSAGE =
  "Thanks. Your message has been received, and I will get back to you as soon as I can.";
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
const MAX_SCHEDULED_NOTIFICATIONS = 10;
const MAX_AMBIGUOUS_RETRY_AGE_MS = 10 * 60 * 1000;

type TurnstileResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

type InquiryAcceptance = {
  accepted?: boolean;
  created?: boolean;
  reason?: string;
  inquiryId?: string;
  notificationStatus?: string;
};

class ConfigurationError extends Error {}

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

function clientIp(request: Request): string {
  const connectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (connectingIp) return connectingIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unavailable";
}

async function parseJsonBody(request: Request): Promise<ContactRequestBody> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (
    Number.isFinite(contentLength) && contentLength > MAX_CONTACT_REQUEST_BYTES
  ) {
    throw new RangeError("Request body is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CONTACT_REQUEST_BYTES) {
    throw new RangeError("Request body is too large.");
  }
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SyntaxError("Request body must be a JSON object.");
  }
  return parsed as ContactRequestBody;
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
  if (remoteIp !== "unavailable") payload.set("remoteip", remoteIp);

  const response = await fetch(TURNSTILE_SITEVERIFY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Turnstile verification was unavailable.");

  const result = await response.json() as TurnstileResult;
  if (result.success !== true) return false;
  const expectedAction = Deno.env.get("CONTACT_TURNSTILE_EXPECTED_ACTION")
    ?.trim() || CONTACT_TURNSTILE_ACTION;
  if (result.action !== expectedAction) return false;

  const expectedHostnames = commaSeparatedEnv(
    "TURNSTILE_EXPECTED_HOSTNAMES",
    DEFAULT_EXPECTED_HOSTNAMES,
  );
  return Boolean(result.hostname && expectedHostnames.has(result.hostname));
}

async function hmacHex(value: string): Promise<string> {
  const auditKey = env("CONTACT_AUDIT_HMAC_KEY");
  if (auditKey.length < 32) {
    throw new ConfigurationError("CONTACT_AUDIT_HMAC_KEY is too short.");
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
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function configuredNotificationClient(): BrevoTransactionalClient {
  return new BrevoTransactionalClient(env("BREVO_API_KEY"));
}

function configuredEmail(name: string): string {
  const value = env(name).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 320) {
    throw new ConfigurationError(`${name} is invalid.`);
  }
  return value;
}

async function rpcTransition(
  admin: ReturnType<typeof createAdminClient>,
  name: string,
  parameters: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await admin.rpc(name, parameters);
  if (error || data !== true) {
    throw new Error(`Database transition failed: ${name}.`);
  }
}

async function processNotification(
  admin: ReturnType<typeof createAdminClient>,
  brevo: BrevoTransactionalClient,
  inquiryId: string | null,
): Promise<"idle" | "sent" | "retryable" | "manual_review"> {
  const claimToken = crypto.randomUUID();
  const { data, error } = await admin.rpc("claim_contact_notification", {
    p_claim_token: claimToken,
    p_inquiry_id: inquiryId,
  });
  if (error) throw error;
  if (!data) return "idle";

  const work = data as ContactNotificationWork;
  const rendered = renderContactNotification(work);
  try {
    const provider = await brevo.sendContactNotification({
      sender: {
        name: env("CONTACT_NOTIFICATION_FROM_NAME").slice(0, 70),
        email: configuredEmail("CONTACT_NOTIFICATION_FROM_EMAIL"),
      },
      recipient: {
        name: "Arthur Pisko Jr.",
        email: configuredEmail("CONTACT_NOTIFICATION_TO_EMAIL"),
      },
      replyTo: {
        name: work.name.slice(0, 70),
        email: work.email,
      },
      subject: rendered.subject,
      textContent: rendered.textContent,
      idempotencyKey: work.notificationKey,
    });
    await rpcTransition(admin, "complete_contact_notification", {
      p_inquiry_id: work.inquiryId,
      p_claim_token: claimToken,
      p_provider_message_id: provider.messageId,
      p_provider_code: provider.duplicate ? "duplicate_parameter" : "accepted",
    });
    return "sent";
  } catch (error) {
    const providerError = error instanceof BrevoTransactionalError
      ? error
      : new BrevoTransactionalError(
        "Contact notification failed.",
        0,
        error instanceof ConfigurationError
          ? "configuration_error"
          : "notification_error",
        !(error instanceof ConfigurationError),
      );
    const firstAttempt = new Date(work.firstAttemptAt).getTime();
    const ambiguousWindowExpired = providerError.ambiguous && (
      !Number.isFinite(firstAttempt) ||
      Date.now() - firstAttempt >= MAX_AMBIGUOUS_RETRY_AGE_MS
    );
    const attemptsExhausted = work.attemptCount >= 6;
    const status = providerError.retryable &&
        !ambiguousWindowExpired &&
        !attemptsExhausted
      ? "retryable"
      : "manual_review";
    await rpcTransition(admin, "defer_contact_notification", {
      p_inquiry_id: work.inquiryId,
      p_claim_token: claimToken,
      p_status: status,
      p_provider_code: providerError.code.slice(0, 120),
      p_retry_seconds: providerError.status === 429 ? 600 : 300,
    });
    console.error("Contact notification deferred", {
      inquiryId: work.inquiryId,
      code: providerError.code,
      status,
    });
    return status;
  }
}

async function processScheduledRequest(request: Request): Promise<Response> {
  const configuredSecret = env("CONTACT_NOTIFICATION_CRON_SECRET");
  const suppliedSecret = request.headers.get("x-contact-notification-secret") ||
    "";
  if (!constantTimeEqual(configuredSecret, suppliedSecret)) {
    return jsonResponse(null, { ok: false, code: "unauthorized" }, 401);
  }

  const body = await parseJsonBody(request);
  if (body.mode !== "scheduled") {
    return jsonResponse(null, { ok: false, code: "invalid_request" }, 400);
  }

  const admin = createAdminClient();
  const brevo = configuredNotificationClient();
  const outcomes = { sent: 0, retryable: 0, manualReview: 0 };
  for (let index = 0; index < MAX_SCHEDULED_NOTIFICATIONS; index += 1) {
    const state = await processNotification(admin, brevo, null);
    if (state === "idle") break;
    if (state === "sent") outcomes.sent += 1;
    if (state === "retryable") outcomes.retryable += 1;
    if (state === "manual_review") outcomes.manualReview += 1;
  }
  return jsonResponse(null, { ok: true, ...outcomes });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const allowedOrigins = commaSeparatedEnv(
    "CONTACT_ALLOWED_ORIGINS",
    DEFAULT_ALLOWED_ORIGINS,
  );
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : null;

  try {
    if (!origin && request.method === "POST") {
      return await processScheduledRequest(request);
    }
    if (!origin || !allowedOrigin) {
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

    let body: ContactRequestBody;
    try {
      body = await parseJsonBody(request);
    } catch (error) {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: "invalid_request",
        message: error instanceof RangeError
          ? "The submitted message is too large."
          : "Send a valid contact request.",
      }, error instanceof RangeError ? 413 : 400);
    }

    const validation = validateContactRequest(body);
    if (!validation.ok) {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: validation.code,
        message: "Check the contact information and try again.",
      }, 400);
    }
    if (validation.spam) {
      return jsonResponse(allowedOrigin, {
        ok: true,
        message: SUCCESS_MESSAGE,
      });
    }

    let turnstileValid: boolean;
    try {
      turnstileValid = await verifyTurnstile(
        request,
        validation.value.turnstileToken,
      );
    } catch {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: "turnstile_failed",
        message: "Spam protection is temporarily unavailable.",
      }, 502);
    }
    if (!turnstileValid) {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: "turnstile_invalid",
        message: "The security check expired. Please try again.",
      }, 403);
    }

    const admin = createAdminClient();
    const [emailHash, clientHash] = await Promise.all([
      hmacHex(`contact-email:v1\0${validation.value.email}`),
      hmacHex(`contact-client:v1\0${clientIp(request)}`),
    ]);
    const { data, error } = await admin.rpc("begin_contact_inquiry", {
      p_request_id: validation.value.requestId,
      p_name: validation.value.name,
      p_email: validation.value.email,
      p_phone: validation.value.phone,
      p_interest: validation.value.interest,
      p_message: validation.value.message,
      p_source_path: validation.value.sourcePath,
      p_email_hash: emailHash,
      p_client_hash: clientHash,
    });
    if (error) throw error;
    const acceptance = data as InquiryAcceptance;
    if (acceptance.accepted !== true) {
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: acceptance.reason === "rate_limited"
          ? "rate_limited"
          : "not_accepted",
        message:
          "Too many messages were submitted. Please wait before trying again.",
      }, 429);
    }
    if (!acceptance.inquiryId) {
      throw new Error("The inquiry ID was not returned.");
    }

    let notificationState = acceptance.notificationStatus || "pending";
    try {
      if (notificationState !== "sent") {
        notificationState = await processNotification(
          admin,
          configuredNotificationClient(),
          acceptance.inquiryId,
        );
      }
    } catch (notificationError) {
      console.error("Immediate contact notification could not run", {
        inquiryId: acceptance.inquiryId,
        code: notificationError instanceof ConfigurationError
          ? "configuration_error"
          : "notification_worker_error",
      });
      notificationState = "pending";
    }

    return jsonResponse(allowedOrigin, {
      ok: true,
      message: SUCCESS_MESSAGE,
      notificationState,
    }, acceptance.created === false ? 200 : 201);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("Contact form configuration error.");
      return jsonResponse(allowedOrigin, {
        ok: false,
        code: "configuration_error",
        message: "The contact form is temporarily unavailable.",
      }, 503);
    }
    console.error("Contact form request failed", {
      code: "request_failed",
      message: error instanceof Error ? error.message.slice(0, 200) : "unknown",
    });
    return jsonResponse(allowedOrigin, {
      ok: false,
      code: "service_unavailable",
      message: "The message could not be received. Please try again.",
    }, 503);
  }
});
