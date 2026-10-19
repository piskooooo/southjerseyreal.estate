import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage, CountyPage, ContactPage, ComparisonGuidePage, ResourceAccordionPage, AboutPage, HubPage, NewsletterPage, NotFoundPage, StandardPage, InsightArticlePage, InsightsIndexPage } from "./components/Layouts";
import { buildStructuredData, getSeoForPath, normalizeRoutePath } from "./content/seo";
import {
  loadPublishedSiteContent,
  isPublicContentReady,
  preparePublicContent,
  seedPublicSiteContent,
  type ManagedPageDocument,
  type PublicSiteContent,
} from "./content/publicSiteContent";
import { getAnalyticsConsent, setAnalyticsConsent, trackPageView, type AnalyticsConsent } from "./analytics";
import { buildTownFinderEntries } from "./content/townFinder";
import { buildGuideFinderEntries } from "./content/guideFinder";
import { shouldHandleInternalNavigation } from "./internalNavigation";
import { isHistoryScrollRestoration, pushHistoryEntry, usePageScrollRestoration } from "./scrollRestoration";

type SiteTheme = "dark" | "light";

const countyPaths = new Set([
  "/atlantic-county",
  "/burlington-county",
  "/camden-county",
  "/cape-may-county",
  "/cumberland-county",
  "/gloucester-county",
  "/salem-county",
]);

const upsertMeta = (attribute: "name" | "property", key: string, content?: string | number) => {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === undefined || content === "") {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = String(content);
};

const upsertLink = (rel: string, href?: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
};

const upsertStructuredData = (data: ReturnType<typeof buildStructuredData>) => {
  let script = document.head.querySelector<HTMLScriptElement>("#structured-data");
  if (!script) {
    script = document.createElement("script");
    script.id = "structured-data";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

const removeStructuredData = () => {
  document.head.querySelector("#structured-data")?.remove();
};

const getStoredTheme = (): SiteTheme => {
  try {
    return window.localStorage.getItem("site-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export default function App() {
  const [path, setPath] = useState(() => normalizeRoutePath(window.location.pathname));
  const [theme, setTheme] = useState<SiteTheme>(getStoredTheme);
  const [analyticsConsentChoice, setAnalyticsConsentChoice] = useState<AnalyticsConsent | null>(getAnalyticsConsent);
  const [siteContent, setSiteContent] = useState<PublicSiteContent>(seedPublicSiteContent);
  const [resolvedContentPath, setResolvedContentPath] = useState("");
  const navigationRequest = useRef(0);
  usePageScrollRestoration(path, resolvedContentPath === path);

  const showPreparedPath = useCallback((nextPath: string) => {
    const prepared = seedPublicSiteContent();
    setSiteContent((current) => {
      if ([...prepared.pages.keys()].every((key) => current.pages.has(key))) return current;
      return {
        sitewide: current.sitewide,
        pages: new Map([...prepared.pages, ...current.pages]),
      };
    });
    setPath(nextPath);
  }, []);

  const pageDocument = useMemo(
    () => siteContent.pages.get(path) || siteContent.pages.get("/")!,
    [path, siteContent],
  );
  const page = pageDocument.page;
  const isKnownPath = siteContent.pages.has(path);
  const townEntries = useMemo(
    () => path === "/counties"
      ? buildTownFinderEntries(Array.from(siteContent.pages.values(), (document) => document.page))
      : [],
    [path, siteContent.pages],
  );
  const guideEntries = useMemo(
    () => path === "/insights" && pageDocument.insightIndex
      ? buildGuideFinderEntries(pageDocument.insightIndex.articles, siteContent.pages.values())
      : [],
    [path, pageDocument.insightIndex, siteContent.pages],
  );

  useEffect(() => {
    let active = true;
    setResolvedContentPath("");
    loadPublishedSiteContent(path).then((published) => {
      if (!active) return;
      setSiteContent(published);
      setResolvedContentPath(path);
    });
    return () => { active = false; };
  }, [path]);

  useEffect(() => {
    const rawPath = window.location.pathname.replace(/\/+$/, "") || "/";
    const seo = isKnownPath
      ? getSeoForPath(path, page, pageDocument.seo)
      : getSeoForPath(path, undefined, {
          title: "Page Not Found | South Jersey Real Estate",
          description: "The requested South Jersey Real Estate page is not available.",
          image: pageDocument.seo.image,
        });

    if (rawPath !== seo.canonicalPath) {
      window.history.replaceState(window.history.state, "", `${seo.canonicalPath}${window.location.search}${window.location.hash}`);
    }

    document.title = seo.title;
    upsertMeta("name", "application-name", siteContent.sitewide.brandName);
    upsertMeta("name", "apple-mobile-web-app-title", siteContent.sitewide.brandName);
    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "robots", isKnownPath ? "index, follow, max-image-preview:large" : "noindex, follow");
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:type", pageDocument.insightArticle ? "article" : "website");
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("property", "og:url", isKnownPath ? seo.canonicalUrl : undefined);
    upsertMeta("property", "og:image", seo.imageUrl);
    upsertMeta("property", "og:image:secure_url", seo.imageUrl);
    upsertMeta("property", "og:image:type", seo.imageType);
    upsertMeta("property", "og:image:width", seo.imageWidth);
    upsertMeta("property", "og:image:height", seo.imageHeight);
    upsertMeta("property", "og:image:alt", seo.imageAlt);
    upsertMeta("property", "og:site_name", siteContent.sitewide.brandName);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", seo.imageUrl);
    upsertMeta("name", "twitter:image:alt", seo.imageAlt);
    upsertMeta("property", "article:published_time", pageDocument.insightArticle?.publishedDate);
    upsertMeta("property", "article:modified_time", pageDocument.insightArticle?.reviewedDate);
    upsertLink("canonical", isKnownPath ? seo.canonicalUrl : undefined);
    if (isKnownPath) {
      upsertStructuredData(buildStructuredData(
        path,
        page,
        {
          title: seo.title,
          description: seo.description,
          image: seo.imageUrl,
        },
        siteContent.sitewide.brandName,
        pageDocument.insightArticle,
      ));
    } else {
      removeStructuredData();
    }
  }, [isKnownPath, pageDocument.insightArticle, pageDocument.seo, page, path, siteContent.sitewide.brandName]);

  useEffect(() => {
    if (isHistoryScrollRestoration()) return;
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      try {
        document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "nearest" });
      } catch {
        // Invalid fragments do not prevent the page from rendering.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [path]);

  useEffect(() => {
    if (window.location.hash && resolvedContentPath !== path) return;
    const seo = isKnownPath
      ? getSeoForPath(path, page, pageDocument.seo)
      : getSeoForPath(path, undefined, {
          title: "Page Not Found | South Jersey Real Estate",
          description: "The requested South Jersey Real Estate page is not available.",
          image: pageDocument.seo.image,
        });
    trackPageView(seo.canonicalPath, seo.title);
  }, [isKnownPath, pageDocument.seo, page, path, resolvedContentPath]);

  useEffect(() => {
    const onPopState = () => {
      const nextPath = normalizeRoutePath(window.location.pathname);
      const request = ++navigationRequest.current;
      if (isPublicContentReady(nextPath)) {
        showPreparedPath(nextPath);
        return;
      }
      void preparePublicContent(nextPath).then(() => {
        if (request === navigationRequest.current) showPreparedPath(nextPath);
      }).catch(() => {
        if (request === navigationRequest.current) window.location.reload();
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      navigationRequest.current += 1;
      window.removeEventListener("popstate", onPopState);
    };
  }, [showPreparedPath]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem("site-theme", theme);
    } catch {
      // Local storage can be unavailable in private or restricted browsing.
    }
  }, [theme]);

  const navigate = (nextPath: string) => {
    let destination: URL;
    try {
      destination = new URL(nextPath, window.location.href);
    } catch {
      return;
    }
    if (destination.origin !== window.location.origin) return;
    const normalized = normalizeRoutePath(destination.pathname);
    const nextLocation = `${normalized}${destination.search}${destination.hash}`;
    const request = ++navigationRequest.current;
    const commitNavigation = () => {
      if (request !== navigationRequest.current) return;
      if (nextLocation !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        pushHistoryEntry(nextLocation);
      } else if (!destination.hash) {
        return;
      }
      showPreparedPath(normalized);
      if (normalized === path) {
        window.dispatchEvent(new PopStateEvent("popstate"));
        if (destination.hash) {
          try {
            document.getElementById(decodeURIComponent(destination.hash.slice(1)))?.scrollIntoView({ block: "nearest" });
          } catch {
            // Invalid fragments do not prevent navigation.
          }
        }
      }
    };
    if (isPublicContentReady(normalized)) commitNavigation();
    else {
      void preparePublicContent(normalized).then(commitNavigation).catch(() => {
        if (request === navigationRequest.current) window.location.assign(nextLocation);
      });
    }
  };

  const chooseAnalyticsConsent = (consent: AnalyticsConsent) => {
    setAnalyticsConsent(consent);
    setAnalyticsConsentChoice(consent);

    if (consent === "granted" && (!window.location.hash || resolvedContentPath === path)) {
      const seo = isKnownPath
        ? getSeoForPath(path, page, pageDocument.seo)
        : getSeoForPath(path, undefined, {
            title: "Page Not Found | South Jersey Real Estate",
            description: "The requested South Jersey Real Estate page is not available.",
            image: pageDocument.seo.image,
          });
      trackPageView(seo.canonicalPath, seo.title);
    }
  };

  const renderPage = (current: ManagedPageDocument) => {
    const currentPage = current.page;
    if (!isKnownPath) return <NotFoundPage navigate={navigate} />;
    if (path === "/") return <HomePage page={currentPage} navigate={navigate} theme={theme} />;
    if (path === "/counties" || path === "/connect") {
      return <HubPage page={currentPage} navigate={navigate} townEntries={townEntries} contentResolved={resolvedContentPath === path} />;
    }
    if (path === "/about") {
      return (
        <AboutPage
          page={currentPage}
          navigate={navigate}
          contentResolved={resolvedContentPath === path}
        />
      );
    }
    if (path === "/contact") return <ContactPage page={currentPage} navigate={navigate} />;
    if (path === "/newsletter") return <NewsletterPage content={current.newsletter} navigate={navigate} />;
    if (current.insightIndex) return (
      <InsightsIndexPage
        content={current.insightIndex}
        navigate={navigate}
        searchEntries={guideEntries}
        contentResolved={resolvedContentPath === path}
      />
    );
    if (current.insightArticle) return (
      <InsightArticlePage
        key={current.page.path}
        article={current.insightArticle}
        navigate={navigate}
        onPrint={() => window.print()}
      />
    );
    if (current.comparisonGuide) return <ComparisonGuidePage page={currentPage} guide={current.comparisonGuide} navigate={navigate} />;
    if (current.resourcePage) return <ResourceAccordionPage page={currentPage} resource={current.resourcePage} navigate={navigate} />;
    if (countyPaths.has(path)) return <CountyPage page={currentPage} navigate={navigate} />;
    return <StandardPage page={currentPage} navigate={navigate} />;
  };

  return (
    <>
      <Header
        brandName={siteContent.sitewide.brandName}
        content={siteContent.sitewide.header}
        currentPath={path}
        navigate={navigate}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      <main id="page">{renderPage(pageDocument)}</main>
      <Footer content={siteContent.sitewide.footer} navigate={navigate} onManagePrivacy={() => setAnalyticsConsentChoice(null)} />
      {analyticsConsentChoice === null && (
        <section className="privacy-banner" aria-label="Privacy choices">
          <div>
            <p>
              {siteContent.sitewide.privacyBanner.message}
            </p>
            <p className="privacy-banner-categories">
              <strong>Necessary:</strong> always active. <strong>Analytics:</strong> optional and off until accepted.
            </p>
            <a
              href="/privacy-policy"
              onClick={(event) => {
                if (!shouldHandleInternalNavigation(event)) return;
                event.preventDefault();
                navigate("/privacy-policy");
              }}
            >
              {siteContent.sitewide.privacyBanner.policyLabel}
            </a>
          </div>
          <div className="privacy-banner-actions">
            <button type="button" onClick={() => chooseAnalyticsConsent("denied")}>{siteContent.sitewide.privacyBanner.declineLabel}</button>
            <button type="button" onClick={() => chooseAnalyticsConsent("granted")}>{siteContent.sitewide.privacyBanner.acceptLabel}</button>
          </div>
        </section>
      )}
    </>
  );
}
