// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { compliance } from "./content/compliance";

const queuedCommands = () => (window.dataLayer || []).map((entry) =>
  Array.from(entry as ArrayLike<unknown>)
);

const eventsNamed = (name: string) => queuedCommands().filter((entry) =>
  entry[0] === "event" && entry[1] === name
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

  it("keeps the Tag Assistant token out of page locations while marking debug events", async () => {
    const { setAnalyticsConsent, trackEvent, trackPageView } = await import("./analytics");

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
        debug_mode: true,
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

    trackEvent("test_event", { form_name: "contact" });
    expect(queuedCommands().at(-1)).toEqual([
      "event",
      "test_event",
      {
        form_name: "contact",
        page_location: `${window.location.origin}/contact?utm_source=google`,
        debug_mode: true,
      },
    ]);
  });

  it("preserves a public section anchor without including it in analytics", async () => {
    const { setAnalyticsConsent, trackEvent, trackPageView } = await import("./analytics");
    const target = document.createElement("section");
    target.id = "wildwood";
    document.body.appendChild(target);
    try {
      window.history.replaceState({}, "", "/cape-may-county?email=person%40example.com#wildwood");
      setAnalyticsConsent("granted");
      trackPageView("/cape-may-county", "Cape May County");
      expect(window.location.hash).toBe("#wildwood");
      expect(window.location.search).toBe("");
      expect(JSON.stringify(queuedCommands())).not.toContain("#wildwood");
      trackEvent("test_event");
      expect(queuedCommands().at(-1)).toEqual(["event", "test_event", {
        page_location: `${window.location.origin}/cape-may-county`,
      }]);
    } finally {
      target.remove();
    }
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

  it("tracks provider, advertising and property inquiries as separate lead types", async () => {
    const { setAnalyticsConsent, trackFormSuccess } = await import("./analytics");

    setAnalyticsConsent("granted");
    trackFormSuccess("contact", "Provider directory inquiry");
    trackFormSuccess("contact", "Advertising inquiry");
    trackFormSuccess("contact", "Property or real estate question");

    const contactLeadTypes = queuedCommands()
      .filter((entry) => entry[0] === "event" && entry[1] === "contact_lead")
      .map((entry) => (entry[2] as { lead_type: string }).lead_type);

    expect(contactLeadTypes).toEqual(["provider_directory", "advertising", "property_question"]);
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

  describe("town profile interest", () => {
    it("does not collect or replay profile opens that happened without consent", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess } = await import("./analytics");

      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      setAnalyticsConsent("denied");
      trackCommunityProfileOpen("/camden-county", "cherry-hill", "anchor");
      expect(window.dataLayer).toBeUndefined();
      expect(document.querySelector("#ga4-script")).toBeNull();

      setAnalyticsConsent("granted");
      trackFormSuccess("contact", "Sell a home");
      expect(eventsNamed("community_profile_open")).toHaveLength(0);
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("community_id");

      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      expect(eventsNamed("community_profile_open")).toHaveLength(1);
    });

    it("sends canonical town and county identifiers with the opening method", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackPageView } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackPageView("/camden-county", "Camden County");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      window.history.pushState({}, "", "/atlantic-county");
      trackPageView("/atlantic-county", "Atlantic County");
      trackCommunityProfileOpen("/atlantic-county", "atlantic-city", "anchor");

      expect(eventsNamed("community_profile_open")).toEqual([
        ["event", "community_profile_open", {
          county_id: "camden",
          community_id: "camden-city",
          open_method: "manual",
        }],
        ["event", "community_profile_open", {
          county_id: "atlantic",
          community_id: "atlantic-city",
          open_method: "anchor",
        }],
      ]);
    });

    it("rejects arbitrary identifiers and towns paired with the wrong county", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      for (const community of ["made-up-town", "person@example.com", "8565550199", "123-main-street", "atlantic-city"]) {
        trackCommunityProfileOpen("/camden-county", community, "manual");
      }
      trackCommunityProfileOpen("/unpublished-county", "camden-city", "manual");
      trackCommunityProfileOpen("/atlantic-county", "atlantic-city", "manual");
      trackFormSuccess("contact", "Sell a home");

      expect(eventsNamed("community_profile_open")).toHaveLength(0);
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("county_id");
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("community_id");
      expect(JSON.stringify(queuedCommands())).not.toMatch(/made-up-town|person@example\.com|8565550199|123-main-street/);
    });

    it("suppresses town tracking on hosts that cannot use the configured measurement ID", async () => {
      vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-PRODUCTION123");
      const { setAnalyticsConsent, trackCommunityProfileOpen } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");

      expect(window.dataLayer).toBeUndefined();
      expect(document.querySelector("#ga4-script")).toBeNull();
    });

    it("counts a town once during the county visit despite repeated renders or opens", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackPageView } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackPageView("/camden-county", "Camden County");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      trackPageView("/camden-county", "Updated Camden County title");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      trackCommunityProfileOpen("/camden-county", "camden-city", "anchor");

      expect(eventsNamed("community_profile_open")).toHaveLength(1);
      expect(eventsNamed("page_view")).toHaveLength(1);
    });

    it("counts a fresh open when a visitor leaves the county route and returns", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackPageView } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackPageView("/camden-county", "Camden County");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      window.history.pushState({}, "", "/about");
      trackPageView("/about", "About");
      window.history.pushState({}, "", "/camden-county");
      trackPageView("/camden-county", "Camden County");
      trackCommunityProfileOpen("/camden-county", "camden-city", "anchor");

      expect(eventsNamed("community_profile_open")).toHaveLength(2);
    });

    it("attributes both successful contact events after navigating away from the town", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess, trackPageView } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackPageView("/camden-county", "Camden County");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      window.history.pushState({}, "", "/contact");
      trackPageView("/contact", "Contact");
      trackFormSuccess("contact", "Sell a home");

      for (const name of ["generate_lead", "contact_lead"]) {
        expect(eventsNamed(name)).toEqual([["event", name, {
          form_name: "contact",
          lead_source: "website_contact_form",
          lead_type: "sell_home",
          county_id: "camden",
          community_id: "camden-city",
        }]]);
      }
    });

    it("uses the most recently opened town even when that town's event was deduplicated", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      trackCommunityProfileOpen("/camden-county", "cherry-hill", "manual");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      trackFormSuccess("contact", "Sell a home");

      expect(eventsNamed("community_profile_open")).toHaveLength(2);
      expect(eventsNamed("contact_lead")[0]?.[2]).toMatchObject({
        county_id: "camden",
        community_id: "camden-city",
      });
    });

    it("adds interest only to contact-directed links and leaves other events unchanged", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackEvent, trackFormSuccess, trackLinkClick } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      trackLinkClick("/contact", "Contact", "county_guidance");
      trackLinkClick(compliance.agentPhoneHref, "Phone", "footer");
      trackLinkClick(`mailto:${compliance.agentEmail}`, "Email", "footer");
      trackLinkClick("/about", "About", "header");
      trackLinkClick("https://example.com", "Resource", "content");
      trackLinkClick("tel:+18565550199", "Provider phone", "provider_card");
      trackLinkClick("mailto:person@example.com", "Provider email", "provider_card");
      trackFormSuccess("newsletter", "Market updates");
      trackEvent("test_event", { form_name: "contact" });

      for (const name of ["phone_click", "email_click"]) {
        expect(eventsNamed(name)[0]?.[2]).toMatchObject({ county_id: "camden", community_id: "camden-city" });
      }
      const internalLinks = eventsNamed("internal_link_click");
      expect(internalLinks[0]?.[2]).toMatchObject({ link_url: "/contact", county_id: "camden", community_id: "camden-city" });
      for (const params of [internalLinks[1]?.[2], eventsNamed("outbound_click")[0]?.[2], eventsNamed("sign_up")[0]?.[2], eventsNamed("test_event")[0]?.[2], eventsNamed("phone_click")[1]?.[2], eventsNamed("email_click")[1]?.[2]]) {
        expect(params).not.toHaveProperty("county_id");
        expect(params).not.toHaveProperty("community_id");
      }
    });

    it("expires both contact attribution and deduplication after thirty inactive minutes", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess } = await import("./analytics");
      const now = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      now.mockReturnValue(1_800_000_000_000 + 30 * 60 * 1000);
      trackFormSuccess("contact", "Sell a home");
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("community_id");

      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      expect(eventsNamed("community_profile_open")).toHaveLength(2);
    });

    it("keeps recent town interest while consented events maintain the active visit", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackEvent, trackFormSuccess, trackPageView } = await import("./analytics");
      const startedAt = 1_800_000_000_000;
      const now = vi.spyOn(Date, "now").mockReturnValue(startedAt);

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      now.mockReturnValue(startedAt + 20 * 60 * 1000);
      window.history.pushState({}, "", "/about");
      trackPageView("/about", "About");
      now.mockReturnValue(startedAt + 40 * 60 * 1000);
      trackEvent("test_event");
      now.mockReturnValue(startedAt + 60 * 60 * 1000);
      trackFormSuccess("contact", "Sell a home");

      expect(eventsNamed("contact_lead")[0]?.[2]).toMatchObject({
        county_id: "camden",
        community_id: "camden-city",
      });
    });

    it("clears town interest and visit deduplication when consent is revoked", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen, trackFormSuccess } = await import("./analytics");

      window.sessionStorage.clear();
      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      expect(window.localStorage.length).toBe(1);
      expect(window.localStorage.getItem("analytics-consent")).toBe("granted");
      expect(window.sessionStorage.length).toBe(0);

      setAnalyticsConsent("denied");
      setAnalyticsConsent("granted");
      trackFormSuccess("contact", "Sell a home");
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("community_id");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      expect(eventsNamed("community_profile_open")).toHaveLength(1);
    });

    it("does not carry town context into a new runtime even when consent remains granted", async () => {
      const { setAnalyticsConsent, trackCommunityProfileOpen } = await import("./analytics");

      setAnalyticsConsent("granted");
      window.history.replaceState({}, "", "/camden-county");
      trackCommunityProfileOpen("/camden-county", "camden-city", "manual");
      vi.resetModules();
      const { trackFormSuccess } = await import("./analytics");
      window.history.replaceState({}, "", "/contact");
      trackFormSuccess("contact", "Sell a home");

      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("county_id");
      expect(eventsNamed("contact_lead")[0]?.[2]).not.toHaveProperty("community_id");
    });
  });
});
