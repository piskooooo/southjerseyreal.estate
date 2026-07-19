const BREVO_TRANSACTIONAL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type FetchLike = typeof fetch;

export type ContactNotificationInput = {
  sender: { name: string; email: string };
  recipient: { name: string; email: string };
  replyTo: { name: string; email: string };
  subject: string;
  textContent: string;
  idempotencyKey: string;
};

type BrevoErrorBody = {
  code?: unknown;
  message?: unknown;
};

export class BrevoTransactionalError extends Error {
  readonly status: number;
  readonly code: string;
  readonly ambiguous: boolean;

  constructor(
    message: string,
    status: number,
    code: string,
    ambiguous = false,
  ) {
    super(message);
    this.name = "BrevoTransactionalError";
    this.status = status;
    this.code = code;
    this.ambiguous = ambiguous;
  }

  get retryable(): boolean {
    return this.status === 0 ||
      this.status === 408 ||
      this.status === 429 ||
      this.status >= 500;
  }
}

export type ContactNotificationResult = {
  messageId: string | null;
  duplicate: boolean;
};

export class BrevoTransactionalClient {
  private readonly apiKey: string;
  private readonly fetcher: FetchLike;

  constructor(apiKey: string, fetcher: FetchLike = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  async sendContactNotification(
    input: ContactNotificationInput,
  ): Promise<ContactNotificationResult> {
    let response: Response;
    try {
      response = await this.fetcher(BREVO_TRANSACTIONAL_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: input.sender,
          to: [input.recipient],
          replyTo: input.replyTo,
          subject: input.subject,
          textContent: input.textContent,
          tags: ["south-jersey-website-contact"],
          headers: {
            idempotencyKey: input.idempotencyKey,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new BrevoTransactionalError(
        "Brevo could not be reached.",
        0,
        "network_error",
        true,
      );
    }

    if (!response.ok) {
      let body: BrevoErrorBody = {};
      try {
        body = await response.json() as BrevoErrorBody;
      } catch {
        // The bounded HTTP status is enough for the operational record.
      }
      const code = typeof body.code === "string"
        ? body.code.slice(0, 120)
        : `http_${response.status}`;
      if (["duplicate_parameter", "duplicate_request"].includes(code)) {
        return { messageId: null, duplicate: true };
      }
      throw new BrevoTransactionalError(
        "Brevo rejected the contact notification.",
        response.status,
        code,
        response.status === 408 || response.status >= 500,
      );
    }

    let body: { messageId?: unknown } = {};
    try {
      body = await response.json() as { messageId?: unknown };
    } catch {
      throw new BrevoTransactionalError(
        "Brevo returned an unreadable acceptance response.",
        502,
        "invalid_provider_response",
        true,
      );
    }
    if (
      typeof body.messageId !== "string" ||
      !body.messageId.trim() ||
      body.messageId.length > 500
    ) {
      throw new BrevoTransactionalError(
        "Brevo returned an invalid message ID.",
        502,
        "invalid_message_id",
        true,
      );
    }
    return { messageId: body.messageId.trim(), duplicate: false };
  }
}
