export const NEWSLETTER_TURNSTILE_ACTION = "turnstile-spin-v2";
export const MAX_NEWSLETTER_REQUEST_BYTES = 8_192;
export const MAX_NEWSLETTER_TURNSTILE_TOKEN_LENGTH = 2_048;

const SINGLE_LINE_CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;

export type NewsletterRequestBody = {
  email?: unknown;
  name?: unknown;
  county?: unknown;
  interest?: unknown;
  consent?: unknown;
  company?: unknown;
  turnstileToken?: unknown;
  source?: unknown;
};

export type ValidNewsletterRequest = {
  email: string;
  name: string;
  county: string;
  interest: string;
  turnstileToken: string;
  source: "newsletter_page";
};

export type NewsletterValidationResult =
  | { ok: true; spam: true }
  | { ok: true; spam: false; value: ValidNewsletterRequest }
  | { ok: false; code: string };

function normalizedLine(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(/\s+/g, " ");
  if (
    normalized.length > maximum ||
    SINGLE_LINE_CONTROL_PATTERN.test(value)
  ) {
    return null;
  }
  return normalized;
}

function normalizedEmail(value: unknown): string | null {
  const email = normalizedLine(value, 320)?.toLowerCase() || "";
  if (email.length < 3) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validateNewsletterRequest(
  body: NewsletterRequestBody,
): NewsletterValidationResult {
  if (typeof body.company === "string" && body.company.trim()) {
    return { ok: true, spam: true };
  }

  const email = normalizedEmail(body.email);
  if (!email) return { ok: false, code: "invalid_email" };

  const name = normalizedLine(body.name ?? "", 120);
  const county = normalizedLine(body.county ?? "", 80);
  const interest = normalizedLine(body.interest ?? "", 80);
  if (name === null || county === null || interest === null) {
    return { ok: false, code: "invalid_request" };
  }

  if (body.consent !== true) {
    return { ok: false, code: "consent_required" };
  }
  if (body.source !== "newsletter_page") {
    return { ok: false, code: "invalid_source" };
  }
  if (
    typeof body.turnstileToken !== "string" ||
    !body.turnstileToken.trim() ||
    body.turnstileToken.length > MAX_NEWSLETTER_TURNSTILE_TOKEN_LENGTH
  ) {
    return { ok: false, code: "turnstile_invalid" };
  }

  return {
    ok: true,
    spam: false,
    value: {
      email,
      name,
      county,
      interest,
      turnstileToken: body.turnstileToken.trim(),
      source: "newsletter_page",
    },
  };
}
