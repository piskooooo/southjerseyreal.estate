import { describe, expect, it } from "vitest";
import { BrevoTransactionalClient, BrevoTransactionalError } from "./brevo.ts";

const input = {
  sender: { name: "South Jersey Real Estate", email: "arthur@example.com" },
  recipient: { name: "Arthur", email: "leads@example.com" },
  replyTo: { name: "Visitor", email: "visitor@example.com" },
  subject: "Website inquiry",
  textContent: "Hello",
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BrevoTransactionalClient", () => {
  it("sends the expected request with its persisted idempotency key", async () => {
    let requestUrl = "";
    let requestHeaders: HeadersInit | undefined;
    let requestBody: Record<string, unknown> | null = null;
    const client = new BrevoTransactionalClient(
      "test-key",
      async (url, init) => {
        requestUrl = String(url);
        requestHeaders = init?.headers;
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse({ messageId: "<message@example.com>" }, 201);
      },
    );

    await expect(client.sendContactNotification(input)).resolves.toEqual({
      messageId: "<message@example.com>",
      duplicate: false,
    });
    expect(requestUrl).toBe("https://api.brevo.com/v3/smtp/email");
    expect(new Headers(requestHeaders).get("api-key")).toBe("test-key");
    expect(requestBody).toMatchObject({
      replyTo: input.replyTo,
      sender: input.sender,
      subject: input.subject,
      textContent: input.textContent,
      headers: { idempotencyKey: input.idempotencyKey },
      tags: ["south-jersey-website-contact"],
    });
  });

  it("treats a duplicate idempotency key as accepted", async () => {
    const client = new BrevoTransactionalClient(
      "test",
      async () => jsonResponse({ code: "duplicate_parameter" }, 400),
    );

    await expect(client.sendContactNotification(input)).resolves.toEqual({
      messageId: null,
      duplicate: true,
    });
  });

  it("classifies a network failure as retryable and ambiguous", async () => {
    const client = new BrevoTransactionalClient("test", async () => {
      throw new Error("timeout");
    });

    await expect(client.sendContactNotification(input)).rejects.toMatchObject(
      {
        name: "BrevoTransactionalError",
        code: "network_error",
        retryable: true,
        ambiguous: true,
      } satisfies Partial<BrevoTransactionalError>,
    );
  });

  it("classifies rate limiting as retryable but not ambiguous", async () => {
    const client = new BrevoTransactionalClient(
      "test",
      async () => jsonResponse({ code: "too_many_requests" }, 429),
    );

    await expect(client.sendContactNotification(input)).rejects.toMatchObject(
      {
        status: 429,
        retryable: true,
        ambiguous: false,
      } satisfies Partial<BrevoTransactionalError>,
    );
  });

  it("treats malformed provider acceptance as ambiguous", async () => {
    const client = new BrevoTransactionalClient(
      "test",
      async () => jsonResponse({ ok: true }, 201),
    );

    await expect(client.sendContactNotification(input)).rejects.toMatchObject(
      {
        code: "invalid_message_id",
        retryable: true,
        ambiguous: true,
      } satisfies Partial<BrevoTransactionalError>,
    );
  });
});
