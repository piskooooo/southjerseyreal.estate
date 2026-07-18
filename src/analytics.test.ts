// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const queuedCommands = () => (window.dataLayer || []).map((entry) =>
  Array.from(entry as ArrayLike<unknown>)
);

const installLocalStorage = () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
};

describe("consent-gated GA4 tracking", () => {
  beforeEach(() => {
    vi.resetModules();
    installLocalStorage();
    delete window.dataLayer;
    delete window.gtag;
    document.querySelector("#ga4-script")?.remove();
  });

  it("does not initialize analytics before consent", async () => {
    const { trackPageView } = await import("./analytics");

    trackPageView("/contact", "Contact", "https://example.com/contact");

    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelector("#ga4-script")).toBeNull();
  });

  it("queues the documented gtag.js command shape after consent", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackPageView("/contact", "Contact", "https://example.com/contact");

    const script = document.querySelector<HTMLScriptElement>("#ga4-script");
    expect(script?.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
    );
    expect(window.dataLayer).toHaveLength(4);
    expect(Array.isArray(window.dataLayer?.[0])).toBe(false);
    expect(queuedCommands()).toEqual([
      ["consent", "default", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "granted",
      }],
      ["js", expect.any(Date)],
      ["config", "G-TEST123", { send_page_view: false }],
      ["event", "page_view", {
        page_path: "/contact",
        page_title: "Contact",
        page_location: "https://example.com/contact",
      }],
    ]);
  });

  it("queues generate_lead and suppresses duplicate page views", async () => {
    const { setAnalyticsConsent, trackEvent, trackPageView } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackPageView("/contact", "Contact", "https://example.com/contact");
    trackPageView("/contact", "Contact", "https://example.com/contact");
    trackEvent("generate_lead", {
      form_name: "contact",
      lead_type: "verification",
    });

    const commands = queuedCommands();
    expect(commands.filter((entry) => entry[1] === "page_view")).toHaveLength(1);
    expect(commands.at(-1)).toEqual([
      "event",
      "generate_lead",
      { form_name: "contact", lead_type: "verification" },
    ]);
  });

  it("revokes analytics and removes the loader when consent is denied", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackPageView("/", "Home", "https://example.com/");
    setAnalyticsConsent("denied");

    expect(window.localStorage.getItem("analytics-consent")).toBe("denied");
    expect(document.querySelector("#ga4-script")).toBeNull();
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });
});
