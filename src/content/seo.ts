import { compliance } from "./compliance";
import rawSeoEntries from "./seoEntries.json";
import type { SitePage } from "./types";

export const siteUrl = "https://southjerseyreal.estate";
export const siteName = "South Jersey Real Estate Guide";
export const defaultImage = "/assets/live/philly-skyline-from-camden-city-camden-jpg.webp";

export type SeoEntry = {
  path: string;
  title: string;
  description: string;
  image?: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
};

export type SeoOverrides = Pick<SeoEntry, "title" | "description"> & {
  image: string;
};

export const seoEntries = rawSeoEntries as SeoEntry[];
export const seoByPath = new Map(seoEntries.map((entry) => [entry.path, entry]));

type SocialImageMetadata = {
  alt: string;
  height: number;
  type: string;
  width: number;
};

const socialImageMetadata = new Map<string, SocialImageMetadata>([
  [defaultImage, {
    alt: "Philadelphia skyline at sunset viewed from Camden, New Jersey.",
    height: 1125,
    type: "image/webp",
    width: 1500,
  }],
  ["/assets/live/arthur-pisko-jr-picture-jpg.webp", {
    alt: "Portrait of Arthur Pisko Jr.",
    height: 720,
    type: "image/webp",
    width: 460,
  }],
  ["/assets/live/pitman-gloucester-jpg.webp", {
    alt: "Broadway in Pitman, Gloucester County, New Jersey.",
    height: 750,
    type: "image/webp",
    width: 1280,
  }],
  ["/assets/live/atlantic-county-map-png.webp", {
    alt: "Map highlighting Atlantic County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
  ["/assets/live/burlington-county-map-png.webp", {
    alt: "Map highlighting Burlington County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
  ["/assets/live/camden-county-map-png.webp", {
    alt: "Map highlighting Camden County, New Jersey.",
    height: 1080,
    type: "image/webp",
    width: 570,
  }],
  ["/assets/live/cape-may-county-map-png.webp", {
    alt: "Map highlighting Cape May County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
  ["/assets/live/cumberland-county-map-png.webp", {
    alt: "Map highlighting Cumberland County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
  ["/assets/live/gloucester-county-map-png.webp", {
    alt: "Map highlighting Gloucester County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
  ["/assets/live/salem-county-map-png.webp", {
    alt: "Map highlighting Salem County, New Jersey.",
    height: 2047,
    type: "image/webp",
    width: 1081,
  }],
]);

const breadcrumbParentByPath = new Map<string, string>([
  ["/counties", "/"],
  ["/connect", "/"],
  ["/atlantic-county", "/counties"],
  ["/burlington-county", "/counties"],
  ["/camden-county", "/counties"],
  ["/cape-may-county", "/counties"],
  ["/cumberland-county", "/counties"],
  ["/gloucester-county", "/counties"],
  ["/salem-county", "/counties"],
  ["/about", "/connect"],
  ["/why-new-jersey", "/connect"],
  ["/why-south-jersey", "/connect"],
  ["/contact", "/connect"],
  ["/newsletter", "/connect"],
  ["/partners", "/connect"],
  ["/advertise", "/connect"],
  ["/faq", "/connect"],
  ["/privacy-policy", "/connect"],
  ["/disclaimer", "/connect"],
  ["/terms-of-service", "/connect"],
]);

const breadcrumbLabelByPath = new Map<string, string>([
  ["/", "Home"],
  ["/counties", "Counties"],
  ["/connect", "Connect"],
]);

export const normalizeRoutePath = (path: string) => {
  const clean = path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  return clean;
};

export const absoluteUrl = (path: string) => `${siteUrl}${path === "/" ? "/" : path}`;

const absoluteImageUrl = (image: string) => {
  if (/^https?:\/\//i.test(image)) return image;
  return `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const localImagePath = (image: string) => {
  if (!/^https?:\/\//i.test(image)) return image.startsWith("/") ? image : `/${image}`;
  try {
    const url = new URL(image);
    return url.origin === siteUrl ? url.pathname : "";
  } catch {
    return "";
  }
};

const pageNameFromTitle = (title: string) => title
  .replace(/\s+\|\s+South Jersey Real Estate(?: Guide)?(?:\s+\|\s+Arthur Pisko Jr\.)?$/i, "")
  .trim();

export const getSeoForPath = (path: string, page?: SitePage, overrides?: SeoOverrides) => {
  const canonicalPath = normalizeRoutePath(path);
  const entry = seoByPath.get(canonicalPath);
  const title = overrides?.title || entry?.title || page?.title || siteName;
  const description = overrides?.description || entry?.description ||
    "Neutral South Jersey community guides and New Jersey residential real-estate information.";
  const image = overrides?.image || entry?.image || defaultImage;
  const pageName = page?.title || pageNameFromTitle(title) || siteName;
  const imageMetadata = socialImageMetadata.get(localImagePath(image));

  return {
    canonicalPath,
    canonicalUrl: absoluteUrl(canonicalPath),
    description,
    imageAlt: imageMetadata?.alt || `${pageName} page image.`,
    imageHeight: imageMetadata?.height,
    imageType: imageMetadata?.type,
    imageUrl: absoluteImageUrl(image),
    imageWidth: imageMetadata?.width,
    pageName,
    title,
  };
};

export const buildBreadcrumbItems = (path: string, page?: SitePage, overrides?: SeoOverrides) => {
  const seo = getSeoForPath(path, page, overrides);
  if (seo.canonicalPath === "/") return [];

  const ancestorPaths: string[] = [];
  const visited = new Set<string>([seo.canonicalPath]);
  let parentPath = breadcrumbParentByPath.get(seo.canonicalPath);
  while (parentPath && !visited.has(parentPath)) {
    ancestorPaths.unshift(parentPath);
    visited.add(parentPath);
    parentPath = breadcrumbParentByPath.get(parentPath);
  }
  if (ancestorPaths[0] !== "/") ancestorPaths.unshift("/");

  return [
    ...ancestorPaths.map((ancestorPath) => ({
      item: absoluteUrl(ancestorPath),
      name: breadcrumbLabelByPath.get(ancestorPath)
        || pageNameFromTitle(seoByPath.get(ancestorPath)?.title || siteName),
    })),
    { item: seo.canonicalUrl, name: seo.pageName },
  ].map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    ...item,
  }));
};

export const buildStructuredData = (
  path: string,
  page?: SitePage,
  overrides?: SeoOverrides,
  brandName = siteName,
) => {
  const seo = getSeoForPath(path, page, overrides);
  const normalizedBrandName = brandName.trim() || siteName;
  const breadcrumbItems = buildBreadcrumbItems(path, page, overrides);
  const webpageId = `${seo.canonicalUrl}#webpage`;
  const breadcrumbId = `${seo.canonicalUrl}#breadcrumb`;
  const primaryImage = {
    "@type": "ImageObject",
    url: seo.imageUrl,
    contentUrl: seo.imageUrl,
    caption: seo.imageAlt,
    ...(seo.imageWidth && seo.imageHeight
      ? { width: seo.imageWidth, height: seo.imageHeight }
      : {}),
  };

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": ["RealEstateAgent", "Organization"],
      "@id": `${siteUrl}/#brokerage`,
      name: compliance.brokerLegalName,
      description: compliance.brokerDescriptor,
      url: compliance.brokerWebsite,
      telephone: compliance.licensedOfficePhoneHref.replace("tel:", ""),
      address: {
        "@type": "PostalAddress",
        streetAddress: compliance.licensedOfficeStreetAddress,
        addressLocality: compliance.licensedOfficeLocality,
        postalCode: compliance.licensedOfficePostalCode,
        addressRegion: compliance.licensedOfficeRegion,
        addressCountry: "US",
      },
      identifier: {
        "@type": "PropertyValue",
        name: "NJDOBI reference number",
        value: compliance.brokerLicenseReferenceNumber,
      },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#agent`,
      name: compliance.agentLicensedName,
      jobTitle: compliance.agentLicenseType,
      url: `${siteUrl}/about`,
      image: `${siteUrl}/assets/live/arthur-pisko-jr-picture-jpg.webp`,
      email: compliance.agentEmail,
      telephone: compliance.agentPhoneHref.replace("tel:", ""),
      worksFor: { "@id": `${siteUrl}/#brokerage` },
      identifier: {
        "@type": "PropertyValue",
        name: "New Jersey real estate license number",
        value: compliance.agentLicenseNumber,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: normalizedBrandName,
      description: "Neutral South Jersey community guides and New Jersey residential real-estate information.",
      publisher: { "@id": `${siteUrl}/#brokerage` },
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: seo.canonicalUrl,
      name: seo.pageName,
      description: seo.description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: [
        { "@id": `${siteUrl}/#brokerage` },
        { "@id": `${siteUrl}/#agent` },
      ],
      primaryImageOfPage: primaryImage,
      ...(breadcrumbItems.length ? { breadcrumb: { "@id": breadcrumbId } } : {}),
      inLanguage: "en-US",
    },
  ];

  if (breadcrumbItems.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: breadcrumbItems,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
};
