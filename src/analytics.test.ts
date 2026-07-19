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
    vi.unstubAllEnvs();
    installLocalStorage();
    window.history.replaceState({}, "", "/");
    delete window.dataLayer;
    delete window.gtag;
    delete (window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"];
    document.querySelector("#ga4-script")?.remove();
    document.cookie = "_ga=; Max-Age=0; Path=/";
  });

  it("does not initialize analytics before consent", async () => {
    const { trackPageView } = await import("./analytics");

    window.history.replaceState({}, "", "/contact");
    trackPageView("/contact", "Contact");

    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelector("#ga4-script")).toBeNull();
  });

  it("queues the documented gtag.js command shape after consent", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    window.history.replaceState({}, "", "/contact");
    setAnalyticsConsent("granted");
    trackPageView("/contact", "Contact");

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
      ["config", "G-TEST123", {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        send_page_view: false,
      }],
      ["event", "page_view", {
        page_path: "/contact",
        page_title: "Contact",
        page_location: `${window.location.origin}/contact`,
        page_referrer: `${window.location.origin}/`,
      }],
    ]);
  });

  it("keeps only safe attribution values in the actual page location", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    window.history.replaceState(
      {},
      "",
      "/contact?utm_source=google&utm_campaign=summer&confirmed=1&email=person%40example.com&utm_content=8565550199#private",
    );
    setAnalyticsConsent("granted");
    trackPageView("/contact", "Contact");

    expect(queuedCommands().at(-1)).toEqual([
      "event",
      "page_view",
      {
        page_path: "/contact",
        page_title: "Contact",
        page_location: `${window.location.origin}/contact?utm_source=google&utm_campaign=summer`,
        page_referrer: `${window.location.origin}/`,
      },
    ]);
    expect(JSON.stringify(queuedCommands())).not.toContain("person@example.com");
    expect(JSON.stringify(queuedCommands())).not.toContain("8565550199");
    expect(JSON.stringify(queuedCommands())).not.toContain("confirmed");
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      "/contact?utm_source=google&utm_campaign=summer",
    );
  });

  it("keeps Tag Assistant debug mode out of Analytics while preserving the browser signal", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    window.history.replaceState(
      {},
      "",
      "/contact?gtm_debug=x123_test&utm_source=google&email=person%40example.com",
    );
    setAnalyticsConsent("granted");
    trackPageView("/contact", "Contact");

    expect(queuedCommands().at(-1)).toEqual([
      "event",
      "page_view",
      {
        page_path: "/contact",
        page_title: "Contact",
        page_location: `${window.location.origin}/contact?utm_source=google`,
        page_referrer: `${window.location.origin}/`,
      },
    ]);
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/contact?utm_source=google&gtm_debug=x123_test",
    );
    expect(queuedCommands()).toContainEqual([
      "config",
      "G-TEST123",
      {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        debug_mode: true,
        send_page_view: false,
      },
    ]);
  });

  it("sends one page view per virtual location with the prior location as referrer", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackPageView("/", "Home");
    window.history.pushState({}, "", "/contact?utm_medium=organic");
    trackPageView("/contact", "Contact");
    trackPageView("/contact", "Updated Contact Title");

    const pageViews = queuedCommands().filter((entry) => entry[1] === "page_view");
    expect(pageViews).toHaveLength(2);
    expect(pageViews[1]).toEqual([
      "event",
      "page_view",
      {
        page_path: "/contact",
        page_title: "Contact",
        page_location: `${window.location.origin}/contact?utm_medium=organic`,
        page_referrer: `${window.location.origin}/`,
      },
    ]);
  });

  it("never sends link labels, email addresses, phone numbers, queries, or fragments", async () => {
    const { setAnalyticsConsent, trackLinkClick } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackLinkClick("mailto:person@example.com", "person@example.com", "content");
    trackLinkClick("tel:+18565550199", "(856) 555-0199", "compliance_disclosure");
    trackLinkClick(
      "https://example.com/resources/person%40example.com?phone=8565550199#private",
      "Email person@example.com",
      "footer_credit",
    );
    trackLinkClick("/contact?email=person%40example.com#private", "Contact", "header_cta");

    const events = queuedCommands().filter((entry) => entry[0] === "event");
    expect(events).toEqual([
      ["event", "email_click", {
        destination_type: "email",
        link_source: "content",
      }],
      ["event", "phone_click", {
        destination_type: "phone",
        link_source: "compliance_disclosure",
      }],
      ["event", "outbound_click", {
        destination_type: "external",
        link_source: "footer_credit",
        link_url: "https://example.com/resources/redacted",
      }],
      ["event", "internal_link_click", {
        destination_type: "internal",
        link_source: "header_cta",
        link_url: "/contact",
      }],
    ]);
    expect(JSON.stringify(events)).not.toMatch(/person(?:%40|@)example\.com|8565550199|link_text|private/i);
  });

  it("emits contact_lead exactly once and keeps newsletter signups separate", async () => {
    const { setAnalyticsConsent, trackFormSuccess } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackFormSuccess("contact", "Buy a home");
    trackFormSuccess("newsletter", "Market updates");
    trackFormSuccess("newsletter", "person@example.com");

    const events = queuedCommands().filter((entry) => entry[0] === "event");
    expect(events).toEqual([
      ["event", "generate_lead", {
        form_name: "contact",
        lead_source: "website_contact_form",
        lead_type: "buy_home",
      }],
      ["event", "contact_lead", {
        form_name: "contact",
        lead_source: "website_contact_form",
        lead_type: "buy_home",
      }],
      ["event", "sign_up", {
        form_name: "newsletter",
        lead_source: "website_newsletter_form",
        lead_type: "market_updates",
        method: "newsletter_form",
      }],
      ["event", "sign_up", {
        form_name: "newsletter",
        lead_source: "website_newsletter_form",
        lead_type: "other_newsletter_interest",
        method: "newsletter_form",
      }],
    ]);
    expect(events.filter((entry) => entry[1] === "contact_lead")).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("person@example.com");
  });

  it("drops potentially identifying values from generic event parameters", async () => {
    const { setAnalyticsConsent, trackEvent } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackEvent("test_event", {
      email: "person@example.com",
      form_name: "contact",
      phone: "856-555-0199",
    });

    expect(queuedCommands().at(-1)).toEqual([
      "event",
      "test_event",
      { form_name: "contact" },
    ]);
  });

  it("refuses a production measurement ID on local and preview-like hosts", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-PRODUCTION123");
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackPageView("/", "Home");

    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelector("#ga4-script")).toBeNull();
  });

  it("revokes, clears, and can reinitialize analytics after a new opt-in", async () => {
    const { setAnalyticsConsent, trackPageView } = await import("./analytics");

    document.cookie = "_ga=test-cookie; Path=/";
    setAnalyticsConsent("granted");
    trackPageView("/", "Home");
    setAnalyticsConsent("denied");

    expect(window.localStorage.getItem("analytics-consent")).toBe("denied");
    expect(document.querySelector("#ga4-script")).toBeNull();
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
    expect(document.cookie).not.toContain("_ga=");
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(true);

    setAnalyticsConsent("granted");
    window.history.replaceState({}, "", "/contact");
    trackPageView("/contact", "Contact");

    expect(document.querySelector("#ga4-script")).not.toBeNull();
    expect((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123"]).toBe(false);
    expect(queuedCommands().filter((entry) => entry[1] === "page_view")).toHaveLength(1);
  });
});
