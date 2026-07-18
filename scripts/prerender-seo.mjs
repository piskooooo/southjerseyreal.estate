import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const siteUrl = "https://southjerseyreal.estate";
const defaultImage = "/assets/live/philly-skyline-from-camden-city-camden-jpg.jpg";
const defaultSiteName = "South Jersey Real Estate";

const routeEntries = JSON.parse(
  await readFile(path.join(projectRoot, "src/content/seoEntries.json"), "utf8"),
);
const template = await readFile(path.join(distRoot, "index.html"), "utf8");

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const absoluteUrl = (value, fallback = "/") => {
  const candidate = String(value || fallback).trim();
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${siteUrl}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
};

const replaceMeta = (html, attribute, key, content) => {
  const escaped = htmlEscape(content);
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>(?:\\s*)`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />\n    `;
  return pattern.test(html)
    ? html.replace(pattern, () => tag)
    : html.replace("</head>", () => `    ${tag}</head>`);
};

const replaceCanonical = (html, href) => {
  const tag = `<link rel="canonical" href="${htmlEscape(href)}" />`;
  return /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, () => tag)
    : html.replace("</head>", () => `    ${tag}\n  </head>`);
};

const replaceTitle = (html, title) => html.replace(
  /<title>[\s\S]*?<\/title>/i,
  () => `<title>${htmlEscape(title)}</title>`,
);

const buildStructuredData = ({ canonicalUrl, description, imageUrl, title }) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: defaultSiteName,
      description: "South Jersey real estate information for buyers and sellers across Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, and Salem Counties.",
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
      email: "arthur@southjerseyreal.estate",
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
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#agent` },
      primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
      inLanguage: "en-US",
    },
  ],
});

const replaceStructuredData = (html, data) => {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  const tag = `<script id="structured-data" type="application/ld+json">${json}</script>`;
  return /<script\s+id="structured-data"[^>]*>[\s\S]*?<\/script>/i.test(html)
    ? html.replace(/<script\s+id="structured-data"[^>]*>[\s\S]*?<\/script>/i, () => tag)
    : html.replace("</head>", () => `    ${tag}\n  </head>`);
};

async function loadPublishedContent() {
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publishableKey = String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!supabaseUrl || !publishableKey) return new Map();

  try {
    const query = new URLSearchParams({
      select: "page_key,published_content,published_at",
      published_at: "not.is.null",
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/site_pages?${query}`, {
      headers: { apikey: publishableKey },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    return new Map(rows.map((row) => [row.page_key, row]));
  } catch (error) {
    console.warn(`SEO prerender is using compiled fallback metadata: ${error instanceof Error ? error.message : error}`);
    return new Map();
  }
}

const publishedByPath = await loadPublishedContent();
const sitewide = publishedByPath.get("__sitewide__")?.published_content;
const siteName = typeof sitewide?.brandName === "string" && sitewide.brandName.trim()
  ? sitewide.brandName.trim()
  : defaultSiteName;
const buildDate = new Date().toISOString().slice(0, 10);
const sitemapRows = [];

for (const entry of routeEntries) {
  const published = publishedByPath.get(entry.path);
  const publishedSeo = published?.published_content?.seo;
  const title = typeof publishedSeo?.title === "string" && publishedSeo.title.trim()
    ? publishedSeo.title.trim()
    : entry.title;
  const description = typeof publishedSeo?.description === "string" && publishedSeo.description.trim()
    ? publishedSeo.description.trim()
    : entry.description;
  const image = typeof publishedSeo?.image === "string" && publishedSeo.image.trim()
    ? publishedSeo.image.trim()
    : entry.image || defaultImage;
  const canonicalUrl = absoluteUrl(entry.path);
  const imageUrl = absoluteUrl(image, defaultImage);

  let html = replaceTitle(template, title);
  html = replaceMeta(html, "name", "description", description);
  html = replaceMeta(html, "name", "robots", "index, follow, max-image-preview:large");
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:type", "website");
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "property", "og:image", imageUrl);
  html = replaceMeta(html, "property", "og:site_name", siteName);
  html = replaceMeta(html, "name", "twitter:card", "summary_large_image");
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceMeta(html, "name", "twitter:image", imageUrl);
  html = replaceCanonical(html, canonicalUrl);
  html = replaceStructuredData(html, buildStructuredData({ canonicalUrl, description, imageUrl, title }));
  html = html.replace("</head>", "    <!-- seo-prerendered -->\n  </head>");

  const outputPath = entry.path === "/"
    ? path.join(distRoot, "index.html")
    : path.join(distRoot, `${entry.path.slice(1)}.html`);
  await writeFile(outputPath, html);

  sitemapRows.push({
    changefreq: entry.changefreq || (entry.path === "/" || entry.path.endsWith("-county") ? "weekly" : "monthly"),
    lastmod: published?.published_at?.slice(0, 10) || buildDate,
    loc: canonicalUrl,
    priority: entry.priority || "0.5",
  });
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapRows.map((row) => [
    "  <url>",
    `    <loc>${htmlEscape(row.loc)}</loc>`,
    `    <lastmod>${row.lastmod}</lastmod>`,
    `    <changefreq>${row.changefreq}</changefreq>`,
    `    <priority>${row.priority}</priority>`,
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

await writeFile(path.join(distRoot, "sitemap.xml"), sitemap);
console.log(`Prerendered SEO metadata for ${routeEntries.length} public routes.`);
