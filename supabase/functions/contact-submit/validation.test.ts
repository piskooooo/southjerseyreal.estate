import { describe, expect, it } from "vitest";
import {
  MAX_TURNSTILE_TOKEN_LENGTH,
  normalizedEmail,
  validateContactRequest,
} from "./validation.ts";

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "123e4567-e89b-42d3-a456-426614174000",
    name: "  Test   Visitor  ",
    email: "TEST@example.com",
    phone: " 856-555-0100 ",
    interest: "General question",
    message: "Hello,\r\nI would like more information.",
    sourcePath: "/contact?topic=buying",
    source: "contact_page",
    company: "",
    turnstileToken: "token",
    ...overrides,
  };
}

describe("validateContactRequest", () => {
  it("normalizes a valid contact request", () => {
    const result = validateContactRequest(validRequest());

    expect(result.ok).toBe(true);
    expect(result.spam).toBe(false);
    if (!result.ok || result.spam) return;
    expect(result.value).toMatchObject({
      name: "Test Visitor",
      email: "test@example.com",
      phone: "856-555-0100",
      message: "Hello,\nI would like more information.",
      sourcePath: "/contact?topic=buying",
    });
  });

  it("silently accepts a populated honeypot without processing fields", () => {
    expect(validateContactRequest({ company: "spam.example" })).toEqual({
      ok: true,
      spam: true,
    });
  });

  it("requires the expected source, a version-four UUID, and a local path", () => {
    expect(validateContactRequest(validRequest({ source: "other" }))).toEqual({
      ok: false,
      code: "invalid_source",
    });
    expect(validateContactRequest(validRequest({
      requestId: "123e4567-e89b-12d3-a456-426614174000",
    }))).toEqual({ ok: false, code: "invalid_request_id" });
    expect(validateContactRequest(validRequest({
      sourcePath: "https://example.com/contact",
    }))).toEqual({ ok: false, code: "invalid_source_path" });
  });

  it("rejects single-line control characters and oversized messages", () => {
    expect(validateContactRequest(validRequest({
      name: "Header\r\nInjected",
    }))).toEqual({ ok: false, code: "invalid_name" });
    expect(validateContactRequest(validRequest({
      message: "x".repeat(5_001),
    }))).toEqual({ ok: false, code: "invalid_message" });
  });

  it("rejects missing or oversized Turnstile tokens", () => {
    expect(validateContactRequest(validRequest({ turnstileToken: "" }))).toEqual({
      ok: false,
      code: "turnstile_invalid",
    });
    expect(validateContactRequest(validRequest({
      turnstileToken: "x".repeat(MAX_TURNSTILE_TOKEN_LENGTH + 1),
    }))).toEqual({ ok: false, code: "turnstile_invalid" });
  });
});

describe("normalizedEmail", () => {
  it("normalizes expected addresses and rejects malformed values", () => {
    expect(normalizedEmail(" PERSON@Example.COM ")).toBe("person@example.com");
    expect(normalizedEmail("person+listing@example.com")).toBe(
      "person+listing@example.com",
    );
    expect(normalizedEmail("person @example.com")).toBeNull();
    expect(normalizedEmail("victim@example.com?bcc=evil@example.com")).toBeNull();
    expect(normalizedEmail("victim%40example.com@example.com")).toBeNull();
    expect(normalizedEmail(".person@example.com")).toBeNull();
  });
});
