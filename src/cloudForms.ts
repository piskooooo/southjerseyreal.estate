import { compliance } from "./content/compliance";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const turnstileSiteKey = String(
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
).trim();

export const CONTACT_TURNSTILE_ACTION = "turnstile-spin-v2";
export const NEWSLETTER_TURNSTILE_ACTION = "turnstile-spin-v2";
export const areCloudFormsConfigured = Boolean(supabaseUrl && turnstileSiteKey);

const REQUEST_TIMEOUT_MS = 20_000;

type FunctionResponse = {
  ok?: boolean;
  code?: string;
  message?: string;
  notificationState?: string;
};

export class CloudFormError extends Error {
  readonly code: string;

  constructor(code = "unknown") {
    super("Website form request failed.");
    this.name = "CloudFormError";
    this.code = code;
  }
}

async function invokeFunction(
  functionName: "contact-submit" | "newsletter-subscribe",
  body: Record<string, unknown>,
): Promise<FunctionResponse> {
  if (!areCloudFormsConfigured) throw new CloudFormError("configuration_error");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({})) as FunctionResponse;
    if (!response.ok || payload.ok !== true) {
      throw new CloudFormError(payload.code || (response.status === 429 ? "rate_limited" : "unknown"));
    }
    return payload;
  } catch (error) {
    if (error instanceof CloudFormError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CloudFormError("timeout");
    }
    throw new CloudFormError("network_error");
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function submitContactInquiry(input: {
  requestId: string;
  firstName: FormDataEntryValue | null;
  lastName: FormDataEntryValue | null;
  email: FormDataEntryValue | null;
  phone: FormDataEntryValue | null;
  interest: FormDataEntryValue | null;
  message: FormDataEntryValue | null;
  company: FormDataEntryValue | null;
  turnstileToken: string;
  sourcePath: string;
}) {
  const name = `${String(input.firstName || "").trim()} ${String(input.lastName || "").trim()}`.trim();
  const result = await invokeFunction("contact-submit", {
    requestId: input.requestId,
    name,
    email: String(input.email || ""),
    phone: String(input.phone || ""),
    interest: String(input.interest || ""),
    message: String(input.message || ""),
    company: String(input.company || ""),
    turnstileToken: input.turnstileToken,
    sourcePath: input.sourcePath,
    source: "contact_page",
  });

  return {
    message: result.message || "Thanks. Your message has been received.",
    notificationState: result.notificationState || "pending",
  };
}

export async function subscribeToNewsletter(input: {
  email: FormDataEntryValue | null;
  name: FormDataEntryValue | null;
  county: FormDataEntryValue | null;
  interest: FormDataEntryValue | null;
  company: FormDataEntryValue | null;
  consent: boolean;
  turnstileToken: string;
}) {
  const result = await invokeFunction("newsletter-subscribe", {
    email: String(input.email || "").trim(),
    name: String(input.name || "").trim(),
    county: String(input.county || "").trim(),
    interest: String(input.interest || "").trim(),
    company: String(input.company || ""),
    consent: input.consent,
    turnstileToken: input.turnstileToken,
    source: "newsletter_page",
  });

  return {
    message: result.message || "Check your email to confirm your subscription.",
  };
}

export function contactErrorMessage(error: unknown): string {
  const code = error instanceof CloudFormError ? error.code : "unknown";
  if (code === "invalid_name") return "Enter your first and last name and try again.";
  if (code === "invalid_email") return "Enter a valid email address and try again.";
  if (code === "invalid_phone") return "Check the phone number and try again.";
  if (code === "invalid_interest") return "Choose what you would like help with.";
  if (["invalid_message", "invalid_request"].includes(code)) {
    return "Enter a message under 5,000 characters and try again.";
  }
  if (code === "rate_limited") {
    return "Too many messages were submitted. Please wait a few minutes and try again.";
  }
  if (code === "timeout") {
    return "The request took too long. Your information is still in the form, so please try again.";
  }
  if (["turnstile_failed", "turnstile_invalid"].includes(code)) {
    return "Spam protection expired or could not be verified. Please complete it again.";
  }
  if (code === "configuration_error") {
    return `The contact form is temporarily unavailable. Please call the licensed brokerage office at ${compliance.licensedOfficePhone}.`;
  }
  return `Your message could not be received. Please try again or call the licensed brokerage office at ${compliance.licensedOfficePhone}.`;
}

export function newsletterErrorMessage(error: unknown): string {
  const code = error instanceof CloudFormError ? error.code : "unknown";
  if (code === "invalid_email") return "Enter a valid email address and try again.";
  if (code === "consent_required") return "Please agree to the subscription terms before continuing.";
  if (code === "rate_limited") return "Please wait a few minutes before trying again.";
  if (["turnstile_failed", "turnstile_invalid"].includes(code)) {
    return "Spam protection expired or could not be verified. Please complete it again.";
  }
  if (code === "configuration_error") {
    return "Newsletter signup is temporarily unavailable. Please try again later.";
  }
  return "The confirmation email could not be started. Please try again in a moment.";
}
