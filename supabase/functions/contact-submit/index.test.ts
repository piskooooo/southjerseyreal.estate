import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactNotificationWork } from "./render.ts";

const { rpc, send } = vi.hoisted(() => ({ rpc: vi.fn(), send: vi.fn() }));

vi.mock("npm:@supabase/supabase-js@2.110.6", () => ({
  createClient: () => ({ rpc }),
}));

vi.mock("./brevo.ts", async (importOriginal) => ({
  ...await importOriginal<typeof import("./brevo.ts")>(),
  BrevoTransactionalClient: class {
    sendContactNotification = send;
  },
}));

const now = new Date("2026-09-05T03:00:00Z");
const inquiryId = "10000000-0000-4000-8000-000000000001";
const notificationKey = "20000000-0000-4000-8000-000000000001";
const configuration: Record<string, string> = {
  CONTACT_NOTIFICATION_CRON_SECRET: "local-test-cron-secret",
  CONTACT_NOTIFICATION_FROM_NAME: "Local test",
  CONTACT_NOTIFICATION_FROM_EMAIL: "sender@example.com",
  CONTACT_NOTIFICATION_TO_EMAIL: "recipient@example.com",
  SUPABASE_URL: "https://test-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "local-test-key",
  BREVO_API_KEY: "local-test-key",
};

function notification(overrides: Partial<ContactNotificationWork> = {}) {
  return {
    inquiryId,
    notificationKey,
    name: "Local test visitor",
    email: "visitor@example.com",
    phone: "555-0100",
    interest: "Buying",
    message: "Local notification regression test",
    sourcePath: "/contact",
    createdAt: new Date(now.getTime() - 60 * 60_000).toISOString(),
    firstAttemptAt: now.toISOString(),
    attemptCount: 1,
    ...overrides,
  } satisfies ContactNotificationWork;
}

describe("contact request and notification safety", () => {
  let handleRequest: (request: Request) => Promise<Response>;
  let environment: Record<string, string>;
  let expectedSiteverifyCalls: number;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    environment = { ...configuration };
    expectedSiteverifyCalls = 0;
    rpc.mockReset();
    send.mockReset().mockResolvedValue({ messageId: "<local-test@example.com>", duplicate: false });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external request in local test."); }));
    vi.stubGlobal("Deno", {
      env: { get: (name: string) => environment[name] },
      serve: (handler: typeof handleRequest) => { handleRequest = handler; },
    });
    await import("./index.ts");
  });

  afterEach(() => {
    expect(fetch).toHaveBeenCalledTimes(expectedSiteverifyCalls);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([
    ["https://southjerseyreal.estate", 204],
    ["https://arthurpisko.realtor", 403],
    ["https://unrelated.example", 403],
  ])("uses the deployed default origin policy for %s", async (origin, status) => {
    const response = await handleRequest(new Request("https://example.invalid/contact-submit", {
      method: "OPTIONS",
      headers: { origin },
    }));
    expect(response.status).toBe(status);
    expect(response.headers.get("access-control-allow-origin")).toBe(status === 204 ? origin : null);
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("preserves an explicitly configured origin instead of widening the defaults", async () => {
    environment.CONTACT_ALLOWED_ORIGINS = "https://arthurpisko.realtor";
    const response = await handleRequest(new Request("https://example.invalid/contact-submit", {
      method: "OPTIONS",
      headers: { origin: "https://arthurpisko.realtor" },
    }));
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://arthurpisko.realtor");
  });

  it.each([
    ["southjerseyreal.estate", 201],
    ["arthurpisko.realtor", 403],
    ["unrelated.example", 403],
  ])("uses the deployed default Turnstile hostname policy for %s", async (hostname, status) => {
    environment.TURNSTILE_SECRET = "local-test-turnstile-secret";
    environment.CONTACT_AUDIT_HMAC_KEY = "local-test-hmac-key-at-least-32-characters";
    expectedSiteverifyCalls = 1;
    vi.mocked(fetch).mockImplementation(async (url) => {
      expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
      return Response.json({ success: true, action: "turnstile-spin-v2", hostname });
    });
    rpc.mockResolvedValue({
      data: { accepted: true, created: true, inquiryId, notificationStatus: "sent" },
      error: null,
    });
    const response = await handleRequest(new Request("https://example.invalid/contact-submit", {
      method: "POST",
      headers: { origin: "https://southjerseyreal.estate", "content-type": "application/json" },
      body: JSON.stringify({
        requestId: inquiryId,
        source: "contact_page",
        name: "Local test visitor",
        email: "visitor@example.com",
        phone: "555-0100",
        interest: "Buying",
        message: "Local default hostname regression test",
        sourcePath: "/contact",
        turnstileToken: "local-test-token",
      }),
    }));
    expect(response.status).toBe(status);
    expect(rpc).toHaveBeenCalledTimes(status === 201 ? 1 : 0);
    expect(send).not.toHaveBeenCalled();
  });

  async function process(work: ContactNotificationWork) {
    let claimed = false;
    rpc.mockImplementation(async (name: string) => {
      if (name === "claim_contact_notification") {
        const data = claimed ? null : work;
        claimed = true;
        return { data, error: null };
      }
      return { data: true, error: null };
    });
    return handleRequest(new Request("https://example.invalid/contact-submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-contact-notification-secret": configuration.CONTACT_NOTIFICATION_CRON_SECRET,
      },
      body: JSON.stringify({ mode: "scheduled" }),
    }));
  }

  it.each([
    ["the 10-minute safety boundary", 10],
    ["a 31-minute outage beyond provider idempotency", 31],
  ])("does not resend after %s", async (_label, minutes) => {
    const response = await process(notification({
      attemptCount: 2,
      firstAttemptAt: new Date(now.getTime() - minutes * 60_000).toISOString(),
    }));

    expect(send).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ ok: true, sent: 0, manualReview: 1 });
    expect(rpc).toHaveBeenCalledWith("defer_contact_notification", expect.objectContaining({
      p_inquiry_id: inquiryId,
      p_status: "manual_review",
    }));
  });

  it("does not resend when the previous attempt time is invalid", async () => {
    await process(notification({ attemptCount: 2, firstAttemptAt: "invalid" }));

    expect(send).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("defer_contact_notification", expect.objectContaining({
      p_status: "manual_review",
    }));
  });

  it("does not send a seventh attempt after a lost worker lease", async () => {
    await process(notification({ attemptCount: 7 }));

    expect(send).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("defer_contact_notification", expect.objectContaining({
      p_status: "manual_review",
    }));
  });

  it("delivers an old inquiry that has never been attempted", async () => {
    const response = await process(notification());

    expect(send).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({ ok: true, sent: 1, manualReview: 0 });
  });

  it("retries within the safety window using the persisted provider key", async () => {
    await process(notification({
      attemptCount: 2,
      firstAttemptAt: new Date(now.getTime() - 9 * 60_000).toISOString(),
    }));

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: notificationKey }));
    expect(rpc).toHaveBeenCalledWith("complete_contact_notification", expect.objectContaining({
      p_inquiry_id: inquiryId,
      p_provider_message_id: "<local-test@example.com>",
    }));
  });
});
