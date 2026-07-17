export const CONTACT_TURNSTILE_ACTION = "turnstile-spin-v2";
export const MAX_CONTACT_REQUEST_BYTES = 16_384;
export const MAX_TURNSTILE_TOKEN_LENGTH = 2_048;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_LOCAL_PATTERN = /^[a-z0-9.!$'*+\-/=_`{|}~^]+$/i;
const EMAIL_DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const SINGLE_LINE_CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;
const MESSAGE_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export type ContactRequestBody = {
  requestId?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  interest?: unknown;
  message?: unknown;
  sourcePath?: unknown;
  source?: unknown;
  company?: unknown;
  turnstileToken?: unknown;
  mode?: unknown;
};

export type ValidContactRequest = {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  sourcePath: string;
  turnstileToken: string;
};

export type ContactValidationResult =
  | { ok: true; spam: true }
  | { ok: true; spam: false; value: ValidContactRequest }
  | { ok: false; code: string };

function normalizedLine(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replaceAll(/\s+/g, " ");
  if (normalized.length > maximum || SINGLE_LINE_CONTROL_PATTERN.test(value)) {
    return null;
  }
  return normalized;
}

function normalizedMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if (
    normalized.length < 1 ||
    normalized.length > 5_000 ||
    MESSAGE_CONTROL_PATTERN.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function normalizedEmail(value: unknown): string | null {
  const email = normalizedLine(value, 320)?.toLowerCase() || "";
  const parts = email.split("@");
  if (parts.length !== 2) return null;

  const [localPart, domain] = parts;
  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !EMAIL_LOCAL_PATTERN.test(localPart) ||
    !EMAIL_DOMAIN_PATTERN.test(domain)
  ) {
    return null;
  }
  return email;
}

export function validateContactRequest(body: ContactRequestBody): ContactValidationResult {
  if (typeof body.company === "string" && body.company.trim()) {
    return { ok: true, spam: true };
  }

  if (body.source !== "contact_page") return { ok: false, code: "invalid_source" };
  if (typeof body.requestId !== "string" || !UUID_V4_PATTERN.test(body.requestId)) {
    return { ok: false, code: "invalid_request_id" };
  }

  const name = normalizedLine(body.name, 120);
  if (!name) return { ok: false, code: "invalid_name" };

  const email = normalizedEmail(body.email);
  if (!email) return { ok: false, code: "invalid_email" };

  const phone = normalizedLine(body.phone, 60);
  if (!phone) return { ok: false, code: "invalid_phone" };

  const interest = normalizedLine(body.interest, 100);
  if (!interest) return { ok: false, code: "invalid_interest" };

  const message = normalizedMessage(body.message);
  if (!message) return { ok: false, code: "invalid_message" };

  const sourcePath = normalizedLine(body.sourcePath, 500);
  if (!sourcePath || !sourcePath.startsWith("/")) {
    return { ok: false, code: "invalid_source_path" };
  }

  if (
    typeof body.turnstileToken !== "string" ||
    !body.turnstileToken.trim() ||
    body.turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH
  ) {
    return { ok: false, code: "turnstile_invalid" };
  }

  return {
    ok: true,
    spam: false,
    value: {
      requestId: body.requestId.toLowerCase(),
      name,
      email,
      phone,
      interest,
      message,
      sourcePath,
      turnstileToken: body.turnstileToken.trim(),
    },
  };
}
