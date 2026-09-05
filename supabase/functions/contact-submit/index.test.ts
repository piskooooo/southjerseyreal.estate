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

describe("contact notification retry safety", () => {
  let handleRequest: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    rpc.mockReset();
    send.mockReset().mockResolvedValue({ messageId: "<local-test@example.com>", duplicate: false });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected external request in local test."); }));
    vi.stubGlobal("Deno", {
      env: { get: (name: string) => configuration[name] },
      serve: (handler: typeof handleRequest) => { handleRequest = handler; },
    });
    await import("./index.ts");
  });

  afterEach(() => {
    expect(fetch).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
