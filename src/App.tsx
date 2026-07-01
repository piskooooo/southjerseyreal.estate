import { useEffect, useMemo, useState } from "react";
import { generatedPages } from "./content/generatedSiteData";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage, CountyPage, ContactPage, ComparisonGuidePage, ResourceAccordionPage, AboutPage, StandardPage } from "./components/Layouts";
import { buildStructuredData, getSeoForPath, normalizeRoutePath } from "./content/seo";
import { pageOverrides } from "./content/pageOverrides";
import { resourcePages } from "./content/resourcePages";
import type { SitePage } from "./content/types";
import { trackPageView } from "./analytics";

const countyPaths = new Set([
  "/atlantic-county",
  "/burlington-county",
  "/camden-county",
  "/cape-may-county",
  "/cumberland-county",
  "/gloucester-county",
  "/salem-county",
]);

const upsertMeta = (attribute: "name" | "property", key: string, content: string) => {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

const upsertLink = (rel: string, href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
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

export default function App() {
  const [path, setPath] = useState(() => normalizeRoutePath(window.location.pathname));

  const pageByPath = useMemo(() => {
    return new Map([...generatedPages, ...pageOverrides].map((page) => [normalizeRoutePath(page.path), page]));
  }, []);

  const page = pageByPath.get(path) || pageByPath.get("/")!;

  useEffect(() => {
    const rawPath = window.location.pathname.replace(/\/+$/, "") || "/";
    const seo = getSeoForPath(path, page);

    if (rawPath !== seo.canonicalPath) {
      window.history.replaceState({}, "", seo.canonicalPath);
    }

    document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", seo.canonicalUrl);
    upsertMeta("property", "og:image", seo.imageUrl);
    upsertMeta("property", "og:site_name", "South Jersey Real Estate");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", seo.imageUrl);
    upsertLink("canonical", seo.canonicalUrl);
    upsertStructuredData(buildStructuredData(path, page));
    trackPageView(seo.canonicalPath, seo.title, seo.canonicalUrl);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, path]);

  useEffect(() => {
    const onPopState = () => setPath(normalizeRoutePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath: string) => {
    const normalized = normalizeRoutePath(nextPath);
    if (normalized === path) return;
    window.history.pushState({}, "", normalized);
    setPath(normalized);
  };

  const renderPage = (currentPage: SitePage) => {
    if (path === "/") return <HomePage page={currentPage} navigate={navigate} />;
    if (path === "/about") return <AboutPage page={currentPage} navigate={navigate} />;
    if (path === "/contact") return <ContactPage page={currentPage} navigate={navigate} />;
    if (path === "/why-new-jersey" || path === "/why-south-jersey") return <ComparisonGuidePage page={currentPage} navigate={navigate} />;
    if (resourcePages[path]) return <ResourceAccordionPage page={currentPage} navigate={navigate} />;
    if (countyPaths.has(path)) return <CountyPage page={currentPage} navigate={navigate} />;
    return <StandardPage page={currentPage} navigate={navigate} />;
  };

  return (
    <>
      <Header currentPath={path} navigate={navigate} />
      <main id="page">{renderPage(page)}</main>
      <Footer navigate={navigate} />
    </>
  );
}
