import { compliance } from "./compliance";
import rawSeoEntries from "./seoEntries.json";
import type { SitePage } from "./types";

export const siteUrl = "https://southjerseyreal.estate";
export const siteName = "South Jersey Real Estate Guide";
export const defaultImage = "/assets/live/philly-skyline-from-camden-city-camden-jpg.jpg";

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

export const normalizeRoutePath = (path: string) => {
  const clean = path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  return clean;
};

export const absoluteUrl = (path: string) => `${siteUrl}${path === "/" ? "/" : path}`;

const absoluteImageUrl = (image: string) => {
  if (/^https?:\/\//i.test(image)) return image;
  return `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

export const getSeoForPath = (path: string, page?: SitePage, overrides?: SeoOverrides) => {
  const canonicalPath = normalizeRoutePath(path);
  const entry = seoByPath.get(canonicalPath);
  const title = overrides?.title || entry?.title || page?.title || siteName;
  const description = overrides?.description || entry?.description ||
    "Neutral South Jersey community guides and New Jersey residential real-estate information.";
  const image = overrides?.image || entry?.image || defaultImage;

  return {
    canonicalPath,
    canonicalUrl: absoluteUrl(canonicalPath),
    description,
    imageUrl: absoluteImageUrl(image),
    title,
  };
};

export const buildStructuredData = (path: string, page?: SitePage, overrides?: SeoOverrides) => {
  const seo = getSeoForPath(path, page, overrides);
  const pageName = seo.title.replace(/\s+\|\s+South Jersey Real Estate$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
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
        image: `${siteUrl}/assets/live/arthur-pisko-jr-picture-jpg.jpg`,
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
        name: siteName,
        description: "Neutral South Jersey community guides and New Jersey residential real-estate information.",
        publisher: { "@id": `${siteUrl}/#brokerage` },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": `${seo.canonicalUrl}#webpage`,
        url: seo.canonicalUrl,
        name: pageName,
        description: seo.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: [
          { "@id": `${siteUrl}/#brokerage` },
          { "@id": `${siteUrl}/#agent` },
        ],
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: seo.imageUrl,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${seo.canonicalUrl}#breadcrumb`,
        itemListElement: seo.canonicalPath === "/"
          ? [{ "@type": "ListItem", position: 1, name: siteName, item: `${siteUrl}/` }]
          : [
              { "@type": "ListItem", position: 1, name: siteName, item: `${siteUrl}/` },
              { "@type": "ListItem", position: 2, name: pageName, item: seo.canonicalUrl },
            ],
      },
    ],
  };
};
