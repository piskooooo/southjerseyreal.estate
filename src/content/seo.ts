import type { SitePage } from "./types";

export const siteUrl = "https://southjerseyreal.estate";
export const siteName = "South Jersey Real Estate";
export const defaultImage = "/assets/live/philly-skyline-from-camden-city-camden-jpg.jpg";

export const routeAliases: Record<string, string> = {
  "/counties": "/atlantic-county",
  "/connect": "/about",
};

export type SeoEntry = {
  path: string;
  title: string;
  description: string;
  image?: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
};

export const seoEntries: SeoEntry[] = [
  {
    path: "/",
    title: "South Jersey Real Estate | Homes for Sale & Local REALTOR®",
    description:
      "Search South Jersey real estate and learn about homes for sale across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
    priority: "1.0",
  },
  {
    path: "/atlantic-county",
    title: "Atlantic County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Atlantic County NJ homes for sale, real estate market info, schools, transportation, parks, and local highlights for towns throughout Atlantic County.",
    image: "/assets/live/atlantic-county-map-png.png",
    priority: "0.9",
  },
  {
    path: "/burlington-county",
    title: "Burlington County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Burlington County NJ homes for sale, real estate market info, schools, transportation, parks, and local highlights from river towns to the Pinelands.",
    image: "/assets/live/burlington-county-map-png.png",
    priority: "0.9",
  },
  {
    path: "/camden-county",
    title: "Camden County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Camden County NJ homes for sale, real estate market info, schools, transportation, parks, and local highlights near Philadelphia and South Jersey.",
    image: "/assets/live/camden-county-map-png.png",
    priority: "0.9",
  },
  {
    path: "/cape-may-county",
    title: "Cape May County NJ Homes for Sale | Shore Real Estate Guide",
    description:
      "Explore Cape May County NJ homes for sale, shore real estate, schools, beaches, transportation, and local highlights across South Jersey beach towns.",
    image: "/assets/live/cape-may-county-map-png.png",
    priority: "0.85",
  },
  {
    path: "/cumberland-county",
    title: "Cumberland County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Cumberland County NJ homes for sale, real estate market info, schools, parks, transportation, and local highlights in Vineland, Millville, Bridgeton, and more.",
    image: "/assets/live/cumberland-county-map-png.png",
    priority: "0.9",
  },
  {
    path: "/gloucester-county",
    title: "Gloucester County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Gloucester County NJ homes for sale, real estate market info, schools, parks, transportation, and local highlights near Philadelphia and South Jersey.",
    image: "/assets/live/gloucester-county-map-png.png",
    priority: "0.9",
  },
  {
    path: "/salem-county",
    title: "Salem County NJ Homes for Sale | Real Estate Guide",
    description:
      "Explore Salem County NJ homes for sale, real estate market info, schools, parks, transportation, and local highlights near Delaware and Pennsylvania.",
    image: "/assets/live/salem-county-map-png.png",
    priority: "0.85",
  },
  {
    path: "/about",
    title: "About Arthur Pisko Jr. | South Jersey REALTOR®",
    description:
      "Meet Arthur Pisko Jr., a South Jersey real estate professional helping buyers and sellers across Gloucester, Camden, Burlington, Atlantic, Cape May, Cumberland, and Salem Counties.",
    image: "/assets/live/arthur-pisko-jr-picture-jpg.jpg",
    priority: "0.7",
  },
  {
    path: "/why-new-jersey",
    title: "Why New Jersey? | NJ vs PA, DE & NY Living Guide",
    description:
      "Compare New Jersey vs Pennsylvania, Delaware, and New York for commuting, lifestyle, shore access, and real estate decisions in South Jersey.",
    priority: "0.8",
  },
  {
    path: "/why-south-jersey",
    title: "Why South Jersey? | Living & Real Estate Guide",
    description:
      "Learn why South Jersey is a smart place to live, buy, and sell, from affordability and shore access to Philadelphia commutes and local communities.",
    priority: "0.8",
  },
  {
    path: "/contact",
    title: "Contact Arthur Pisko Jr. | South Jersey REALTOR®",
    description:
      "Contact Arthur Pisko Jr. for South Jersey home selling help, buyer guidance, local real estate questions, and custom home search support.",
    priority: "0.75",
  },
  {
    path: "/partners",
    title: "South Jersey Real Estate Partners | Local Resources",
    description:
      "Find trusted South Jersey real estate partners and local resources for lending, title, inspections, contractors, and transaction support.",
    priority: "0.55",
  },
  {
    path: "/advertise",
    title: "Advertise With South Jersey Real Estate | Local Visibility",
    description:
      "Advertise your South Jersey local business to home buyers, sellers, and residents through relevant county and town real estate pages.",
    priority: "0.5",
  },
  {
    path: "/faq",
    title: "South Jersey Real Estate FAQ | Buyers, Sellers & Partners",
    description:
      "Answers to common questions about buying, selling, partnerships, advertising, and working with a South Jersey real estate professional.",
    priority: "0.45",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | South Jersey Real Estate",
    description: "Privacy policy for South Jersey Real Estate and Arthur Pisko Jr.",
    priority: "0.2",
  },
  {
    path: "/disclaimer",
    title: "Disclaimer | South Jersey Real Estate",
    description: "Website disclaimer for South Jersey Real Estate and Arthur Pisko Jr.",
    priority: "0.2",
  },
  {
    path: "/terms-of-service",
    title: "Terms of Service | South Jersey Real Estate",
    description: "Terms of service for South Jersey Real Estate and Arthur Pisko Jr.",
    priority: "0.2",
  },
];

export const seoByPath = new Map(seoEntries.map((entry) => [entry.path, entry]));

export const normalizeRoutePath = (path: string) => {
  const clean = path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  return routeAliases[clean] || clean;
};

export const absoluteUrl = (path: string) => `${siteUrl}${path === "/" ? "/" : path}`;

export const getSeoForPath = (path: string, page?: SitePage) => {
  const canonicalPath = normalizeRoutePath(path);
  const entry = seoByPath.get(canonicalPath);
  const title = entry?.title || page?.title || siteName;
  const description =
    entry?.description ||
    "South Jersey Real Estate information for buyers and sellers across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.";
  const image = entry?.image || defaultImage;

  return {
    canonicalPath,
    canonicalUrl: absoluteUrl(canonicalPath),
    description,
    imageUrl: `${siteUrl}${image}`,
    title,
  };
};

export const buildStructuredData = (path: string, page?: SitePage) => {
  const seo = getSeoForPath(path, page);
  const pageName = seo.title.replace(/\s+\|\s+South Jersey Real Estate$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        description:
          "South Jersey real estate information for buyers and sellers across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
        publisher: { "@id": `${siteUrl}/#agent` },
        inLanguage: "en-US",
      },
      {
        "@type": ["RealEstateAgent", "LocalBusiness"],
        "@id": `${siteUrl}/#agent`,
        name: "Arthur Pisko Jr.",
        url: `${siteUrl}/about`,
        image: `${siteUrl}/assets/live/arthur-pisko-jr-picture-jpg.jpg`,
        telephone: "+1-856-493-7501",
        email: "arthurpisko@gmail.com",
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Deptford Township",
          addressRegion: "NJ",
          addressCountry: "US",
        },
        areaServed: [
          "Atlantic County, NJ",
          "Burlington County, NJ",
          "Camden County, NJ",
          "Cape May County, NJ",
          "Cumberland County, NJ",
          "Gloucester County, NJ",
          "Salem County, NJ",
        ],
        memberOf: {
          "@type": "RealEstateAgent",
          name: "The Plum Real Estate Group",
          url: "https://www.theplumrealestategroup.com/our-team",
        },
        sameAs: [
          "https://www.instagram.com/arthurpisko/",
          "https://www.facebook.com/arthurpiskoREA/",
          "https://www.arthurpisko.realtor/",
          "https://www.realtor.com/realestateagents/659c35c962a5ff070b97f4b8",
          "https://www.zillow.com/profile/arthurpisko",
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${seo.canonicalUrl}#webpage`,
        url: seo.canonicalUrl,
        name: pageName,
        description: seo.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#agent` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: seo.imageUrl,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${seo.canonicalUrl}#breadcrumb`,
        itemListElement:
          seo.canonicalPath === "/"
            ? [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: siteName,
                  item: `${siteUrl}/`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: siteName,
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: pageName,
                  item: seo.canonicalUrl,
                },
              ],
      },
    ],
  };
};
