type GtagValue = string | number | boolean | Date | Record<string, unknown>;
type Gtag = (command: string, target: string | Date, params?: Record<string, unknown>) => void;
export type AnalyticsConsent = "granted" | "denied";
export type AnalyticsFormName = "contact" | "newsletter";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const configuredMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const measurementId = configuredMeasurementId && /^G-[A-Z0-9]+$/i.test(configuredMeasurementId)
  ? configuredMeasurementId
  : undefined;
const analyticsConsentKey = "analytics-consent";
const productionHostname = "southjerseyreal.estate";
const testMeasurementId = "G-TEST123";
const attributionParameterNames = new Set([
  "dclid",
  "gbraid",
  "gclid",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_source",
  "utm_term",
  "wbraid",
]);
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const contactLeadTypes = new Map([
  ["buy a home", "buy_home"],
  ["buy and sell", "buy_and_sell"],
  ["partnership or advertising inquiry", "partnership_or_advertising"],
  ["sell a home", "sell_home"],
]);
const newsletterLeadTypes = new Map([
  ["buying in south jersey", "buying_south_jersey"],
  ["local community guides", "community_guides"],
  ["market updates", "market_updates"],
  ["selling in south jersey", "selling_south_jersey"],
]);

let initialized = false;
let lastPageLocation = "";
let previousPageLocation = "";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const containsPotentialPersonalData = (value: string) => {
  const decoded = safeDecode(value).trim();
  if (!decoded) return false;
  if (/\b(?:mailto|tel):/i.test(decoded) || emailPattern.test(decoded)) return true;

  const digits = decoded.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const sanitizePathname = (pathname: string) => {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const sanitized = withLeadingSlash.split("/").map((segment) => {
    const decoded = safeDecode(segment);
    if (containsPotentialPersonalData(decoded) || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return "redacted";
    }
    return segment;
  }).join("/");

  return sanitized || "/";
};

const sanitizeAttributionValue = (value: string) => {
  const trimmed = value.trim().slice(0, 200);
  if (!trimmed || containsPotentialPersonalData(trimmed) || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return "";
  }
  return trimmed;
};

const sanitizeHttpUrl = (rawUrl: string, includeAttribution: boolean) => {
  if (!isBrowser()) return "";

  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";

    const safeParams = new URLSearchParams();
    if (includeAttribution) {
      for (const [rawName, rawValue] of url.searchParams) {
        const name = rawName.toLowerCase();
        if (!attributionParameterNames.has(name) || safeParams.has(name)) continue;
        const value = sanitizeAttributionValue(rawValue);
        if (value) safeParams.set(name, value);
      }
    }

    const query = safeParams.size > 0 ? `?${safeParams.toString()}` : "";
    return `${url.protocol}//${url.host.toLowerCase()}${sanitizePathname(url.pathname)}${query}`;
  } catch {
    return "";
  }
};

const replaceUnsafeBrowserLocation = (safeLocation: string) => {
  try {
    const safeUrl = new URL(safeLocation);
    const safeRelativeUrl = `${safeUrl.pathname}${safeUrl.search}`;
    const currentRelativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (safeRelativeUrl !== currentRelativeUrl) {
      window.history.replaceState(window.history.state, "", safeRelativeUrl);
    }
  } catch {
    // A malformed location is handled by suppressing the page view below.
  }
};

const sanitizeEventParams = (params: Record<string, GtagValue>) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => {
    if (typeof value === "string") return !containsPotentialPersonalData(value);
    if (value instanceof Date || typeof value !== "object" || value === null) return true;

    try {
      return !containsPotentialPersonalData(JSON.stringify(value));
    } catch {
      return false;
    }
  }),
);

const isAllowedAnalyticsHost = () => {
  if (!isBrowser() || !measurementId) return false;
  if (window.location.hostname.toLowerCase() === productionHostname) return true;

  const isLocalTestHost = ["127.0.0.1", "localhost"].includes(window.location.hostname.toLowerCase());
  return measurementId === testMeasurementId && isLocalTestHost;
};

const setGaDisabled = (disabled: boolean) => {
  if (!measurementId || !isBrowser()) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = disabled;
};

const clearAnalyticsCookies = () => {
  const isProductionDomain = window.location.hostname === productionHostname
    || window.location.hostname.endsWith(`.${productionHostname}`);
  const domainAttributes = isProductionDomain
    ? ["", `; Domain=${productionHostname}`, `; Domain=.${productionHostname}`]
    : [""];

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !/^_ga(?:_|$)/.test(name)) return;
    for (const domainAttribute of domainAttributes) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domainAttribute}; SameSite=Lax`;
    }
  });
};

const disableAnalytics = () => {
  setGaDisabled(true);
  document.querySelector<HTMLScriptElement>("#ga4-script")?.remove();
  clearAnalyticsCookies();
  delete window.gtag;
  delete window.dataLayer;
  initialized = false;
  lastPageLocation = "";
  previousPageLocation = "";
};

export const getAnalyticsConsent = (): AnalyticsConsent | null => {
  if (!isBrowser()) return null;

  try {
    const value = window.localStorage.getItem(analyticsConsentKey);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
};

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(analyticsConsentKey, consent);
  } catch {
    // Local storage can be unavailable in private or restricted browsing.
  }

  const wasActive = initialized || Boolean(document.querySelector("#ga4-script"));
  if (initialized && window.gtag) {
    window.gtag("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: consent,
    });
  }

  if (consent === "denied") {
    disableAnalytics();

    // Removing a loaded script cannot unregister every listener installed by
    // gtag.js. A reload starts a clean runtime after the denial is persisted.
    if (wasActive && import.meta.env.MODE !== "test") window.location.reload();
  }
};

const ensureAnalytics = () => {
  if (!isBrowser()) return false;
  if (getAnalyticsConsent() !== "granted") return false;
  if (!isAllowedAnalyticsHost()) return false;
  if (!measurementId) return false;

  setGaDisabled(false);
  if (window.gtag) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(
    _command: string,
    _target: string | Date,
    _params?: Record<string, unknown>,
  ) {
    // Google Tag's loader expects the standard array-like `arguments` object.
    window.dataLayer?.push(arguments);
  };

  if (!document.querySelector<HTMLScriptElement>("#ga4-script")) {
    const script = document.createElement("script");
    script.id = "ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  if (!initialized) {
    window.gtag("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: false,
    });
    initialized = true;
  }

  return true;
};

export const trackPageView = (path: string, title: string) => {
  if (!isBrowser() || getAnalyticsConsent() !== "granted" || !isAllowedAnalyticsHost()) return;
  const pageLocation = sanitizeHttpUrl(window.location.href, true);
  if (!pageLocation || pageLocation === lastPageLocation) return;
  replaceUnsafeBrowserLocation(pageLocation);
  if (!ensureAnalytics()) return;

  const pageReferrer = previousPageLocation || sanitizeHttpUrl(document.referrer, false);
  const params: Record<string, GtagValue> = {
    page_path: sanitizePathname(path),
    page_title: containsPotentialPersonalData(title) ? "South Jersey Real Estate Guide" : title,
    page_location: pageLocation,
  };
  if (pageReferrer) params.page_referrer = pageReferrer;

  window.gtag?.("event", "page_view", params);
  lastPageLocation = pageLocation;
  previousPageLocation = pageLocation;
};

export const trackEvent = (name: string, params: Record<string, GtagValue> = {}) => {
  if (!ensureAnalytics()) return;
  window.gtag?.("event", name, sanitizeEventParams(params));
};

export const trackFormSuccess = (formName: AnalyticsFormName, interest: string) => {
  const normalizedInterest = interest.trim().toLowerCase();
  const leadType = formName === "contact"
    ? contactLeadTypes.get(normalizedInterest) || "other_contact_inquiry"
    : newsletterLeadTypes.get(normalizedInterest) || "other_newsletter_interest";

  if (formName === "contact") {
    const params = {
      form_name: "contact",
      lead_source: "website_contact_form",
      lead_type: leadType,
    } as const;
    trackEvent("generate_lead", params);
    trackEvent("contact_lead", params);
    return;
  }

  trackEvent("sign_up", {
    form_name: "newsletter",
    lead_source: "website_newsletter_form",
    lead_type: leadType,
    method: "newsletter_form",
  });
};

export const trackLinkClick = (href: string, _label: string, source: string) => {
  const normalizedHref = href.trim();
  const isPhone = normalizedHref.toLowerCase().startsWith("tel:");
  const isEmail = normalizedHref.toLowerCase().startsWith("mailto:");
  const isInternal = normalizedHref.startsWith("/") || normalizedHref.startsWith("#");
  const eventName = isPhone
    ? "phone_click"
    : isEmail
      ? "email_click"
      : isInternal
        ? "internal_link_click"
        : "outbound_click";
  const linkSource = containsPotentialPersonalData(source)
    ? "unknown"
    : source.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "unknown";
  const params: Record<string, GtagValue> = {
    destination_type: isPhone ? "phone" : isEmail ? "email" : isInternal ? "internal" : "external",
    link_source: linkSource,
  };

  if (!isPhone && !isEmail) {
    const safeUrl = sanitizeHttpUrl(normalizedHref, false);
    if (safeUrl) {
      params.link_url = isInternal ? new URL(safeUrl).pathname : safeUrl;
    }
  }

  trackEvent(eventName, params);
};
