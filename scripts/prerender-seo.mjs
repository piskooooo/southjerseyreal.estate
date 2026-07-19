import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadEnv } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const siteUrl = "https://southjerseyreal.estate";
const defaultSiteName = "South Jersey Real Estate Guide";
const buildEnv = loadEnv("production", projectRoot, "VITE_");

const [compliance, routeEntries, builtTemplate] = await Promise.all([
  readFile(path.join(projectRoot, "src/content/complianceData.json"), "utf8").then(JSON.parse),
  readFile(path.join(projectRoot, "src/content/seoEntries.json"), "utf8").then(JSON.parse),
  readFile(path.join(distRoot, "index.html"), "utf8"),
]);
const template = builtTemplate.replace(/\s*<!-- seo-(?:prerendered|404|admin-entry) -->/g, "");

const vite = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  root: projectRoot,
  server: { middlewareMode: true },
});

let seoModule;
let siteEditorModule;
try {
  [seoModule, siteEditorModule] = await Promise.all([
    vite.ssrLoadModule("/src/content/seo.ts"),
    vite.ssrLoadModule("/src/content/siteEditor.ts"),
  ]);
} finally {
  await vite.close();
}

const {
  buildStructuredData,
  getSeoForPath,
} = seoModule;
const {
  normalizeManagedContent,
  seedPublicSiteContent,
  SITEWIDE_CONTENT_KEY,
  validateManagedContentForPublish,
} = siteEditorModule;

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const metaPattern = (attribute, key) => new RegExp(
  `<meta\\b(?=[^>]*\\b${attribute}="${escapeRegex(key)}")[^>]*>\\s*`,
  "i",
);

const replaceMeta = (html, attribute, key, content) => {
  const pattern = metaPattern(attribute, key);
  if (content === undefined || content === null || content === "") {
    return html.replace(pattern, "");
  }
  const tag = `<meta ${attribute}="${key}" content="${htmlEscape(content)}" />\n    `;
  return pattern.test(html)
    ? html.replace(pattern, () => tag)
    : html.replace("</head>", () => `    ${tag}</head>`);
};

const replaceCanonical = (html, href) => {
  const pattern = /<link\b(?=[^>]*\brel="canonical")[^>]*>\s*/i;
  if (!href) return html.replace(pattern, "");
  const tag = `<link rel="canonical" href="${htmlEscape(href)}" />`;
  return pattern.test(html)
    ? html.replace(pattern, () => `${tag}\n    `)
    : html.replace("</head>", () => `    ${tag}\n  </head>`);
};

const replaceTitle = (html, title) => html.replace(
  /<title>[\s\S]*?<\/title>/i,
  () => `<title>${htmlEscape(title)}</title>`,
);

const replaceStructuredData = (html, data) => {
  const pattern = /<script\s+id="structured-data"[^>]*>[\s\S]*?<\/script>\s*/i;
  if (!data) return html.replace(pattern, "");
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  const tag = `<script id="structured-data" type="application/ld+json">${json}</script>`;
  return pattern.test(html)
    ? html.replace(pattern, () => `${tag}\n    `)
    : html.replace("</head>", () => `    ${tag}\n  </head>`);
};

const replaceRoot = (html, content) => html.replace(
  /<body>[\s\S]*<\/body>/i,
  () => `<body>\n    <div id="root">${content}</div>\n  </body>`,
);

const addMarker = (html, marker) => html.includes(`<!-- ${marker} -->`)
  ? html
  : html.replace("</head>", () => `    <!-- ${marker} -->\n  </head>`);

const validPublishedTimestamp = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "" : parsed.toISOString();
};

async function loadPublishedRows() {
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || buildEnv.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const publishableKey = String(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || buildEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!supabaseUrl || !publishableKey) return [];

  try {
    const query = new URLSearchParams({
      select: "page_key,published_content,published_at",
      published_at: "not.is.null",
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/site_pages?${query}`, {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn(`SEO prerender is using compiled fallback content: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

const publicContent = seedPublicSiteContent();
const acceptedPublishedRows = new Map();
for (const row of await loadPublishedRows()) {
  const pageKey = String(row?.page_key || "");
  try {
    const content = normalizeManagedContent(pageKey, row?.published_content);
    validateManagedContentForPublish(pageKey, content);
    if (pageKey === SITEWIDE_CONTENT_KEY) {
      publicContent.sitewide = content;
    } else if (publicContent.pages.has(pageKey)) {
      publicContent.pages.set(pageKey, content);
      acceptedPublishedRows.set(pageKey, row);
    }
  } catch (error) {
    console.warn(`SEO prerender ignored invalid published content for ${pageKey || "an unknown page"}: ${error instanceof Error ? error.message : error}`);
  }
}

const siteName = typeof publicContent.sitewide?.brandName === "string" && publicContent.sitewide.brandName.trim()
  ? publicContent.sitewide.brandName.trim()
  : defaultSiteName;

const addUniqueText = (values, candidate) => {
  const text = typeof candidate === "string" ? candidate.trim() : "";
  if (text.length < 24 || values.includes(text)) return;
  values.push(text);
};

const prerenderParagraphs = (document, description) => {
  const values = [];
  for (const section of document.page?.sections || []) {
    for (const block of section.blocks || []) {
      if (String(block.tag).toUpperCase() === "P") addUniqueText(values, block.text);
    }
  }
  for (const structuredBody of [document.comparisonGuide, document.resourcePage]) {
    if (!structuredBody) continue;
    addUniqueText(values, structuredBody.intro);
    addUniqueText(values, structuredBody.supportText);
    addUniqueText(values, structuredBody.closingText);
  }
  if (document.newsletter) {
    addUniqueText(values, document.newsletter.introduction);
    addUniqueText(values, document.newsletter.note);
  }
  return values.filter((value) => value !== description).slice(0, 3);
};

const addInternalLink = (links, knownPaths, label, href, currentPath) => {
  const pathValue = typeof href === "string" ? href.trim() : "";
  const labelValue = typeof label === "string" ? label.trim() : "";
  if (!pathValue.startsWith("/") || pathValue.startsWith("//") || !knownPaths.has(pathValue)) return;
  if (!labelValue || pathValue === currentPath || links.some((link) => link.href === pathValue)) return;
  links.push({ href: pathValue, label: labelValue });
};

const prerenderLinks = (currentPath) => {
  const links = [];
  const knownPaths = new Set(routeEntries.map((entry) => entry.path));
  const header = publicContent.sitewide.header;
  addInternalLink(links, knownPaths, siteName, "/", currentPath);
  addInternalLink(links, knownPaths, header.countiesLabel, header.countiesPath, currentPath);
  addInternalLink(links, knownPaths, header.connectLabel, header.connectPath, currentPath);
  addInternalLink(links, knownPaths, header.contactLabel, "/contact", currentPath);

  const contextualLinks = currentPath === "/counties" || currentPath.endsWith("-county")
    ? header.countyLinks
    : header.connectLinks;
  for (const link of contextualLinks) {
    addInternalLink(links, knownPaths, link.label, link.path, currentPath);
  }
  return links.slice(0, 12);
};

const renderBrokerageDisclosure = () => `
      <section class="brokerage-disclosure brokerage-disclosure-header" aria-label="Licensed brokerage disclosure">
        <div class="brokerage-disclosure-primary">
          <a class="brokerage-legal-name" href="${htmlEscape(compliance.brokerWebsite)}">${htmlEscape(compliance.brokerLegalName)}</a>
          <span class="brokerage-descriptor">${htmlEscape(compliance.brokerDescriptor)}</span>
          <span>Licensed brokerage office: <a href="${htmlEscape(compliance.licensedOfficePhoneHref)}">${htmlEscape(compliance.licensedOfficePhone)}</a></span>
        </div>
        <p class="agent-license-disclosure">${htmlEscape(compliance.agentLicensedName)}, ${htmlEscape(compliance.agentLicenseType)}, NJ Real Estate License #${htmlEscape(compliance.agentLicenseNumber)}.</p>
      </section>`;

const renderPublicShell = (document, seo) => {
  const links = prerenderLinks(seo.canonicalPath);
  const paragraphs = prerenderParagraphs(document, seo.description);
  return `${renderBrokerageDisclosure()}
      <header class="site-header">
        <a class="brand" href="/">${htmlEscape(siteName)}</a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          ${links.slice(0, 4).map((link) => `<a href="${htmlEscape(link.href)}"${link.href === seo.canonicalPath ? ' aria-current="page"' : ""}>${htmlEscape(link.label)}</a>`).join("\n          ")}
        </nav>
      </header>
      <main id="page" data-seo-prerendered="true">
        <div class="standard-page">
          <section class="section text-section">
            <div>
              <p class="section-eyebrow">${htmlEscape(siteName)}</p>
              <h1>${htmlEscape(document.page?.title || seo.pageName)}</h1>
              <p>${htmlEscape(seo.description)}</p>
              ${paragraphs.map((paragraph) => `<p>${htmlEscape(paragraph)}</p>`).join("\n              ")}
              ${links.length ? `<nav aria-label="Related pages"><h2>Explore this website</h2><ul>${links.map((link) => `<li><a href="${htmlEscape(link.href)}">${htmlEscape(link.label)}</a></li>`).join("")}</ul></nav>` : ""}
            </div>
          </section>
        </div>
      </main>`;
};

const applyPublicHead = (html, document, seo) => {
  let output = replaceTitle(html, seo.title);
  output = replaceMeta(output, "name", "application-name", siteName);
  output = replaceMeta(output, "name", "apple-mobile-web-app-title", siteName);
  output = replaceMeta(output, "name", "description", seo.description);
  output = replaceMeta(output, "name", "robots", "index, follow, max-image-preview:large");
  output = replaceMeta(output, "property", "og:title", seo.title);
  output = replaceMeta(output, "property", "og:description", seo.description);
  output = replaceMeta(output, "property", "og:type", "website");
  output = replaceMeta(output, "property", "og:locale", "en_US");
  output = replaceMeta(output, "property", "og:url", seo.canonicalUrl);
  output = replaceMeta(output, "property", "og:image", seo.imageUrl);
  output = replaceMeta(output, "property", "og:image:secure_url", seo.imageUrl);
  output = replaceMeta(output, "property", "og:image:type", seo.imageType);
  output = replaceMeta(output, "property", "og:image:width", seo.imageWidth);
  output = replaceMeta(output, "property", "og:image:height", seo.imageHeight);
  output = replaceMeta(output, "property", "og:image:alt", seo.imageAlt);
  output = replaceMeta(output, "property", "og:site_name", siteName);
  output = replaceMeta(output, "name", "twitter:card", "summary_large_image");
  output = replaceMeta(output, "name", "twitter:title", seo.title);
  output = replaceMeta(output, "name", "twitter:description", seo.description);
  output = replaceMeta(output, "name", "twitter:image", seo.imageUrl);
  output = replaceMeta(output, "name", "twitter:image:alt", seo.imageAlt);
  output = replaceCanonical(output, seo.canonicalUrl);
  output = replaceStructuredData(output, buildStructuredData(
    seo.canonicalPath,
    document.page,
    { title: seo.title, description: seo.description, image: seo.imageUrl },
    siteName,
  ));
  output = replaceRoot(output, renderPublicShell(document, seo));
  return addMarker(output, "seo-prerendered");
};

const sitemapRows = [];
for (const entry of routeEntries) {
  const document = publicContent.pages.get(entry.path);
  if (!document) throw new Error(`Missing public content for ${entry.path}`);
  const seo = getSeoForPath(entry.path, document.page, document.seo);
  const html = applyPublicHead(template, document, seo);
  const outputPath = entry.path === "/"
    ? path.join(distRoot, "index.html")
    : path.join(distRoot, `${entry.path.slice(1)}.html`);
  await writeFile(outputPath, html);

  sitemapRows.push({
    changefreq: entry.changefreq || (entry.path === "/" || entry.path.endsWith("-county") ? "weekly" : "monthly"),
    lastmod: validPublishedTimestamp(acceptedPublishedRows.get(entry.path)?.published_at),
    loc: seo.canonicalUrl,
    priority: entry.priority || "0.5",
  });
}

const renderNonPublicShell = (eyebrow, heading, copy, linkLabel = "", linkHref = "") => `
      <main id="page" data-seo-prerendered="true">
        <div class="standard-page not-found-page">
          <section class="section text-section"><div>
            <p class="section-eyebrow">${htmlEscape(eyebrow)}</p>
            <h1>${htmlEscape(heading)}</h1>
            <p>${htmlEscape(copy)}</p>
            ${linkLabel && linkHref ? `<a class="button" href="${htmlEscape(linkHref)}">${htmlEscape(linkLabel)}</a>` : ""}
          </div></section>
        </div>
      </main>`;

let notFoundHtml = replaceTitle(template, "Page Not Found | South Jersey Real Estate Guide");
notFoundHtml = replaceMeta(notFoundHtml, "name", "description", "The requested South Jersey Real Estate Guide page is not available.");
notFoundHtml = replaceMeta(notFoundHtml, "name", "robots", "noindex, follow");
notFoundHtml = replaceMeta(notFoundHtml, "property", "og:title", "Page Not Found | South Jersey Real Estate Guide");
notFoundHtml = replaceMeta(notFoundHtml, "property", "og:description", "The requested South Jersey Real Estate Guide page is not available.");
notFoundHtml = replaceMeta(notFoundHtml, "property", "og:url", undefined);
notFoundHtml = replaceMeta(notFoundHtml, "name", "twitter:title", "Page Not Found | South Jersey Real Estate Guide");
notFoundHtml = replaceMeta(notFoundHtml, "name", "twitter:description", "The requested South Jersey Real Estate Guide page is not available.");
notFoundHtml = replaceCanonical(notFoundHtml, "");
notFoundHtml = replaceStructuredData(notFoundHtml, null);
notFoundHtml = replaceRoot(notFoundHtml, renderNonPublicShell(
  "Page not found",
  "This page is not available.",
  "The address may have changed, or the page may no longer exist.",
  "Return Home",
  "/",
));
notFoundHtml = addMarker(notFoundHtml, "seo-404");
await writeFile(path.join(distRoot, "404.html"), notFoundHtml);

let adminHtml = replaceTitle(template, "Website Editor | South Jersey Real Estate");
adminHtml = replaceMeta(adminHtml, "name", "description", "Private South Jersey Real Estate website editor.");
adminHtml = replaceMeta(adminHtml, "name", "robots", "noindex, nofollow, noarchive");
adminHtml = replaceMeta(adminHtml, "property", "og:title", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:description", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:url", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:type", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:locale", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image:secure_url", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image:type", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image:width", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image:height", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:image:alt", undefined);
adminHtml = replaceMeta(adminHtml, "property", "og:site_name", undefined);
adminHtml = replaceMeta(adminHtml, "name", "twitter:card", undefined);
adminHtml = replaceMeta(adminHtml, "name", "twitter:title", undefined);
adminHtml = replaceMeta(adminHtml, "name", "twitter:description", undefined);
adminHtml = replaceMeta(adminHtml, "name", "twitter:image", undefined);
adminHtml = replaceMeta(adminHtml, "name", "twitter:image:alt", undefined);
adminHtml = replaceCanonical(adminHtml, "");
adminHtml = replaceStructuredData(adminHtml, null);
adminHtml = replaceRoot(adminHtml, '<main aria-busy="true" style="min-height:100vh;display:grid;place-items:center">Opening website editor…</main>');
adminHtml = addMarker(adminHtml, "seo-admin-entry");
await writeFile(path.join(distRoot, "admin.html"), adminHtml);

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapRows.map((row) => [
    "  <url>",
    `    <loc>${htmlEscape(row.loc)}</loc>`,
    ...(row.lastmod ? [`    <lastmod>${row.lastmod}</lastmod>`] : []),
    `    <changefreq>${row.changefreq}</changefreq>`,
    `    <priority>${row.priority}</priority>`,
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

await writeFile(path.join(distRoot, "sitemap.xml"), sitemap);
console.log(`Prerendered content and SEO metadata for ${routeEntries.length} public routes, plus /admin and a true 404 page.`);
