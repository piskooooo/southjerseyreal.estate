type GtagValue = string | number | boolean | Date | Record<string, unknown>;
type Gtag = (command: string, target: string | Date, params?: Record<string, unknown>) => void;
export type AnalyticsConsent = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const analyticsConsentKey = "analytics-consent";
let initialized = false;
let lastPageView = "";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

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

  if (window.gtag) {
    window.gtag("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: consent,
    });
  }
};

const ensureAnalytics = () => {
  if (!isBrowser()) return false;
  if (getAnalyticsConsent() !== "granted") return false;
  if (window.gtag) return true;
  if (!measurementId) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: [string, string | Date, Record<string, unknown>?]) => {
    window.dataLayer?.push(args);
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
    window.gtag("config", measurementId, { send_page_view: false });
    initialized = true;
  }

  return true;
};

export const trackPageView = (path: string, title: string, location: string) => {
  if (!ensureAnalytics()) return;

  const key = `${path}|${title}`;
  if (key === lastPageView) return;
  lastPageView = key;

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: location,
  });
};

export const trackEvent = (name: string, params: Record<string, GtagValue> = {}) => {
  if (!ensureAnalytics()) return;
  window.gtag?.("event", name, params);
};

export const trackLinkClick = (href: string, label: string, source: string) => {
  const eventName = href.startsWith("tel:")
    ? "phone_click"
    : href.startsWith("mailto:")
      ? "email_click"
      : href.startsWith("/")
        ? "internal_link_click"
        : "outbound_click";

  trackEvent(eventName, {
    link_url: href,
    link_text: label,
    link_source: source,
  });
};
