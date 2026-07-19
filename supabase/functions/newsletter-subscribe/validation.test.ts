import { describe, expect, it } from "vitest";
import {
  MAX_NEWSLETTER_TURNSTILE_TOKEN_LENGTH,
  validateNewsletterRequest,
} from "./validation.ts";

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    email: " READER@Example.com ",
    name: "  Newsletter   Reader ",
    county: " Camden   County ",
    interest: "Market updates",
    consent: true,
    company: "",
    turnstileToken: " token ",
    source: "newsletter_page",
    ...overrides,
  };
}

describe("validateNewsletterRequest", () => {
  it("normalizes a valid signup", () => {
    const result = validateNewsletterRequest(validRequest());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(`Unexpected validation error: ${result.code}`);
    }
    expect(result.spam).toBe(false);
    if (result.spam) return;
    expect(result.value).toEqual({
      email: "reader@example.com",
      name: "Newsletter Reader",
      county: "Camden County",
      interest: "Market updates",
      turnstileToken: "token",
      source: "newsletter_page",
    });
  });

  it("accepts omitted optional profile fields", () => {
    const result = validateNewsletterRequest(validRequest({
      name: undefined,
      county: undefined,
      interest: undefined,
    }));

    expect(result).toMatchObject({
      ok: true,
      spam: false,
      value: { name: "", county: "", interest: "" },
    });
  });

  it("silently accepts a populated honeypot", () => {
    expect(validateNewsletterRequest({ company: "spam.example" })).toEqual({
      ok: true,
      spam: true,
    });
  });

  it("rejects invalid email and control characters in profile fields", () => {
    expect(validateNewsletterRequest(validRequest({
      email: "not-an-email",
    }))).toEqual({ ok: false, code: "invalid_email" });
    expect(validateNewsletterRequest(validRequest({
      county: "Camden\r\nInjected",
    }))).toEqual({ ok: false, code: "invalid_request" });
    expect(validateNewsletterRequest(validRequest({
      name: "x".repeat(121),
    }))).toEqual({ ok: false, code: "invalid_request" });
  });

  it("requires explicit consent and the newsletter source", () => {
    expect(validateNewsletterRequest(validRequest({ consent: false }))).toEqual(
      {
        ok: false,
        code: "consent_required",
      },
    );
    expect(validateNewsletterRequest(validRequest({ source: "contact_page" })))
      .toEqual({
        ok: false,
        code: "invalid_source",
      });
  });

  it("requires a bounded Turnstile token", () => {
    expect(validateNewsletterRequest(validRequest({
      turnstileToken: "",
    }))).toEqual({ ok: false, code: "turnstile_invalid" });
    expect(validateNewsletterRequest(validRequest({
      turnstileToken: "x".repeat(MAX_NEWSLETTER_TURNSTILE_TOKEN_LENGTH + 1),
    }))).toEqual({ ok: false, code: "turnstile_invalid" });
  });
});
