import { describe, expect, it } from "vitest";
import { renderContactNotification } from "./render.ts";

function work(overrides: Record<string, unknown> = {}) {
  return {
    inquiryId: "123e4567-e89b-42d3-a456-426614174000",
    notificationKey: "223e4567-e89b-42d3-a456-426614174000",
    name: "Test Visitor",
    email: "visitor@example.com",
    phone: "856-555-0100",
    interest: "Buying",
    message: "I would like a showing.",
    sourcePath: "/contact?topic=buying",
    createdAt: "2026-07-17T16:00:00.000Z",
    firstAttemptAt: "2026-07-17T16:00:00.000Z",
    attemptCount: 1,
    ...overrides,
  };
}

describe("renderContactNotification", () => {
  it("renders every operational field as plain text", () => {
    const rendered = renderContactNotification(work());

    expect(rendered.subject).toMatch(/^\[Website Inquiry\] Buying/);
    expect(rendered.textContent).toMatch(/Name: Test Visitor/);
    expect(rendered.textContent).toMatch(/Email: visitor@example\.com/);
    expect(rendered.textContent).toMatch(/Phone: 856-555-0100/);
    expect(rendered.textContent).toMatch(/Source: \/contact\?topic=buying/);
    expect(rendered.textContent).toMatch(/Inquiry ID: 123e4567/);
    expect(rendered.textContent).toMatch(/did not subscribe the visitor/);
    expect(rendered.textContent).not.toMatch(/<html/i);
  });

  it("bounds a long subject", () => {
    const rendered = renderContactNotification(work({
      name: "N".repeat(120),
      interest: "I".repeat(100),
    }));

    expect(rendered.subject).toHaveLength(180);
  });
});
