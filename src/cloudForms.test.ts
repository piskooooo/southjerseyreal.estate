// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CloudFormError,
  contactErrorMessage,
  newsletterErrorMessage,
  submitContactInquiry,
  subscribeToNewsletter,
} from "./cloudForms";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const contactInput = {
  requestId: "123e4567-e89b-42d3-a456-426614174000",
  firstName: " Arthur ",
  lastName: " Pisko ",
  email: "visitor@example.com",
  phone: "856-555-0100",
  interest: "Buy a home",
  message: "Please contact me.",
  company: "",
  turnstileToken: "contact-token",
  sourcePath: "/contact?topic=buying",
};

const newsletterInput = {
  email: " reader@example.com ",
  name: " Newsletter Reader ",
  county: " Camden County ",
  interest: " Market updates ",
  company: "",
  consent: true,
  turnstileToken: "newsletter-token",
};

describe("cloud form requests", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("submits a normalized contact payload to the contact function", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: true,
      message: "Contact received.",
      notificationState: "sent",
    }, 201));

    await expect(submitContactInquiry(contactInput)).resolves.toEqual({
      message: "Contact received.",
      notificationState: "sent",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://test-project.supabase.co/functions/v1/contact-submit",
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      requestId: contactInput.requestId,
      name: "Arthur Pisko",
      email: contactInput.email,
      phone: contactInput.phone,
      interest: contactInput.interest,
      message: contactInput.message,
      company: contactInput.company,
      turnstileToken: contactInput.turnstileToken,
      sourcePath: contactInput.sourcePath,
      source: "contact_page",
    });
  });

  it("submits a trimmed newsletter payload to the newsletter function", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: true,
      message: "Check your inbox.",
    }));

    await expect(subscribeToNewsletter(newsletterInput)).resolves.toEqual({
      message: "Check your inbox.",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://test-project.supabase.co/functions/v1/newsletter-subscribe",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "reader@example.com",
      name: "Newsletter Reader",
      county: "Camden County",
      interest: "Market updates",
      company: "",
      consent: true,
      turnstileToken: "newsletter-token",
      source: "newsletter_page",
    });
  });

  it("preserves a bounded server error code", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: false,
      code: "invalid_email",
    }, 400));

    await expect(subscribeToNewsletter(newsletterInput)).rejects.toMatchObject({
      name: "CloudFormError",
      code: "invalid_email",
    });
  });

  it("maps an unstructured 429 response to rate_limited", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 429));

    await expect(submitContactInquiry(contactInput)).rejects.toMatchObject({
      code: "rate_limited",
    });
  });

  it("maps network failures to network_error", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("network unavailable"));

    await expect(subscribeToNewsletter(newsletterInput)).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("aborts a request after twenty seconds", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      })
    );

    const request = subscribeToNewsletter(newsletterInput);
    const assertion = expect(request).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
  });
});

describe("public form error messages", () => {
  it.each([
    ["invalid_name", "Enter your first and last name and try again."],
    ["invalid_email", "Enter a valid email address and try again."],
    ["invalid_phone", "Check the phone number and try again."],
    ["invalid_interest", "Choose what you would like help with."],
    ["invalid_message", "Enter a message under 5,000 characters and try again."],
    ["rate_limited", "Too many messages were submitted. Please wait a few minutes and try again."],
    ["timeout", "The request took too long. Your information is still in the form, so please try again."],
    ["turnstile_invalid", "Spam protection expired or could not be verified. Please complete it again."],
  ])("maps contact code %s", (code, message) => {
    expect(contactErrorMessage(new CloudFormError(code))).toBe(message);
  });

  it.each([
    ["invalid_email", "Enter a valid email address and try again."],
    ["consent_required", "Please agree to the subscription terms before continuing."],
    ["rate_limited", "Please wait a few minutes before trying again."],
    ["turnstile_failed", "Spam protection expired or could not be verified. Please complete it again."],
    ["configuration_error", "Newsletter signup is temporarily unavailable. Please try again later."],
  ])("maps newsletter code %s", (code, message) => {
    expect(newsletterErrorMessage(new CloudFormError(code))).toBe(message);
  });
});
