// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SitePage } from "../content/types";
import { ContactPage, NewsletterPage } from "./Layouts";

type TurnstileRenderOptions = Parameters<
  NonNullable<Window["turnstile"]>["render"]
>[1];

let turnstileOptions: TurnstileRenderOptions[] = [];
const fakeTurnstile = {
  render: vi.fn((_container: HTMLElement, options: TurnstileRenderOptions) => {
    turnstileOptions.push(options);
    return `widget-${turnstileOptions.length}`;
  }),
  remove: vi.fn(),
  reset: vi.fn(),
};

const contactPage: SitePage = {
  path: "/contact",
  title: "Contact",
  sections: [
    {
      id: "contact-intro",
      blocks: [
        { tag: "H1", text: "Contact Arthur" },
        { tag: "P", text: "Tell me how I can help with your South Jersey move." },
      ],
      images: [],
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function completeTurnstile(token: string) {
  await waitFor(() => expect(fakeTurnstile.render).toHaveBeenCalled());
  act(() => turnstileOptions.at(-1)?.callback(token));
}

describe("public cloud forms", () => {
  beforeEach(() => {
    turnstileOptions = [];
    vi.clearAllMocks();
    window.turnstile = fakeTurnstile;
    window.history.replaceState({}, "", "/");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders and submits the newsletter form only after Turnstile completes", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: true,
      message: "Check your email to confirm your subscription.",
    }));

    render(<NewsletterPage navigate={vi.fn()} />);

    const email = screen.getByRole("textbox", { name: /Email/ });
    const consent = screen.getByRole("checkbox");
    const submit = screen.getByRole("button", { name: "Sign Up" });
    expect(email).toBeRequired();
    expect(consent).toBeRequired();
    expect(submit).toBeDisabled();
    expect(screen.getByText(/unsubscribe at any time/)).toBeVisible();

    await user.type(email, "reader@example.com");
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Test Reader");
    await user.click(consent);
    await completeTurnstile("newsletter-test-token");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(await screen.findByText(
      "Check your email to confirm your subscription.",
    )).toBeVisible();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      email: "reader@example.com",
      name: "Test Reader",
      consent: true,
      source: "newsletter_page",
      turnstileToken: "newsletter-test-token",
    });
    expect(submit).toBeDisabled();
    expect(fakeTurnstile.reset).toHaveBeenCalled();
  });

  it("renders required contact controls and submits a complete inquiry", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: true,
      message: "Thanks. Your message has been received.",
      notificationState: "sent",
    }, 201));

    render(<ContactPage page={contactPage} navigate={vi.fn()} />);

    const firstName = screen.getByRole("textbox", { name: /First Name/ });
    const lastName = screen.getByRole("textbox", { name: /Last Name/ });
    const email = screen.getByRole("textbox", { name: /Email/ });
    const phone = screen.getByRole("textbox", { name: /Phone/ });
    const message = screen.getByRole("textbox", { name: /Message/ });
    const submit = screen.getByRole("button", { name: "Send Message" });

    for (const control of [firstName, lastName, email, phone, message]) {
      expect(control).toBeRequired();
    }
    expect(screen.getByText(/does not subscribe you to newsletters/)).toBeVisible();
    expect(submit).toBeDisabled();

    await user.type(firstName, "Test");
    await user.type(lastName, "Visitor");
    await user.type(email, "visitor@example.com");
    await user.type(phone, "856-555-0100");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /What can I help with/ }),
      "Buy a home",
    );
    await user.type(message, "I would like help finding a home.");
    await completeTurnstile("contact-test-token");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(await screen.findByText("Thanks. Your message has been received.")).toBeVisible();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      name: "Test Visitor",
      email: "visitor@example.com",
      phone: "856-555-0100",
      interest: "Buy a home",
      message: "I would like help finding a home.",
      source: "contact_page",
      turnstileToken: "contact-test-token",
    });
    expect(submit).toBeDisabled();
    expect(fakeTurnstile.reset).toHaveBeenCalled();
  });

  it("renders the double-opt-in confirmation state from the redirect URL", () => {
    window.history.replaceState({}, "", "/newsletter?confirmed=1");

    const view = render(<NewsletterPage navigate={vi.fn()} />);

    expect(screen.getByText(
      "Your email is confirmed. Welcome to the newsletter.",
    )).toHaveAttribute("role", "status");

    window.history.replaceState({}, "", "/newsletter");
    view.rerender(<NewsletterPage navigate={vi.fn()} />);
    expect(screen.getByText(
      "Your email is confirmed. Welcome to the newsletter.",
    )).toHaveAttribute("role", "status");
  });
});
