import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = process.env.SJRE_IMAGE_AUDIT_DIR || "/tmp/sjre-community-images";
const userAgent = "SouthJerseyRealEstateImageAudit/1.0 (https://southjerseyreal.estate)";

const countyNames = new Map([
  ["/atlantic-county", "Atlantic"],
  ["/burlington-county", "Burlington"],
  ["/camden-county", "Camden"],
  ["/cape-may-county", "Cape May"],
  ["/cumberland-county", "Cumberland"],
  ["/gloucester-county", "Gloucester"],
  ["/salem-county", "Salem"],
]);

const searchOverrides = new Map([
  ["Audubon & Audubon Park", "Audubon"],
  ["Berlin Borough & Berlin Township", "Berlin Borough"],
  ["Buena Borough", "Buena"],
  ["Evesham Township (Marlton)", "Evesham Township"],
  ["Hamilton Township (Mays Landing)", "Hamilton Township"],
  ["Harrison Township (Mullica Hill)", "Harrison Township"],
  ["Pine Hill & Pine Valley", "Pine Hill"],
]);

const fileOverrides = new Map([
  ["Alloway Township", "Alloway Creek, NJ upstream from New Bridge, Dec. 2024.jpg"],
  ["Elsinboro Township", "Elsinboro Township, NJ municipal building, Dec. 2024.jpg"],
  ["Glassboro", "Glassboro, NJ municipal building, Sept. 2024.jpg"],
  ["Greenwich Township|Gloucester", "Greenwich Lake Park, Gloucester County, NJ, Dec. 2024.jpg"],
  ["Mansfield Township", "Mansfield Township, Burlington County, NJ Municipal Complex, Dec. 2024.jpg"],
  ["Millville", "Millville NJ High St 1.jpg"],
  ["Moorestown Township", "Main St. Moorestown Arial.webp"],
  ["Pennsville", "St. George’s Episcopal Church Pennsville New Jersey 08.jpg"],
  ["Somers Point", "Somers Point City Hall2.jpg"],
  ["Ventnor City", "Ventnor City rowhouses.jpg"],
]);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const decodeHtml = (value = "") => value
  .replace(/<br\s*\/?>/gi, " ")
  .replace(/<[^>]+>/g, "")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#039;", "'")
  .replaceAll("&nbsp;", " ")
  .replace(/\s+/g, " ")
  .trim();

const normalize = (value = "") => value
  .toLowerCase()
  .replace(/,? new jersey$/i, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const normalizeWithoutType = (value = "") => normalize(value)
  .replace(/\b(city|borough|township)\b/g, "")
  .replace(/\s+/g, " ")
  .trim();

const fetchJson = async (url, label, attempt = 0) => {
  const response = await fetch(url, { headers: { "User-Agent": userAgent } });
  if (response.status === 429 && attempt < 4) {
    await sleep(750 * (attempt + 1));
    return fetchJson(url, label, attempt + 1);
  }
  if (!response.ok) throw new Error(`${label} failed: ${response.status}`);
  return response.json();
};

const parseGeneratedPages = async () => {
  const source = await readFile(path.join(root, "src/content/generatedSiteData.ts"), "utf8");
  const marker = "export const generatedPages: SitePage[] = ";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Could not locate generatedPages.");
  return JSON.parse(source.slice(start + marker.length, source.lastIndexOf(";")));
};

const wikipediaSearch = async (name, county) => {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  const query = `\"${name}\" \"${county} County\" New Jersey`;
  Object.entries({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "10",
    prop: "pageimages|pageprops",
    piprop: "original|thumbnail",
    pithumbsize: "1600",
    format: "json",
    origin: "*",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const payload = await fetchJson(url, "Wikipedia search");
  return Object.values(payload.query?.pages || {});
};

const scorePage = (page, name, county) => {
  if (!page.pageprops?.page_image_free || !page.original?.source) return -1000;
  const title = normalize(page.title);
  const target = normalize(name);
  const titleWithoutType = normalizeWithoutType(page.title);
  const targetWithoutType = normalizeWithoutType(name);
  const description = String(page.pageprops?.["wikibase-shortdesc"] || "").toLowerCase();
  const targetType = target.match(/\b(city|borough|township)\b/)?.[1] || "";
  const titleType = title.match(/\b(city|borough|township)\b/)?.[1] || "";
  let score = 0;
  if (title === target) score += 120;
  else if (titleWithoutType === targetWithoutType) score += 55;
  else if (titleWithoutType.includes(targetWithoutType) || targetWithoutType.includes(titleWithoutType)) score += 25;
  if (page.title.endsWith(", New Jersey")) score += 30;
  if (description.includes(`${county.toLowerCase()} county`)) score += 80;
  if (/city|borough|township|municipality/.test(description)) score += 20;
  if (targetType && titleType === targetType) score += 25;
  else if (targetType && titleType && titleType !== targetType) score -= 90;
  else if (targetType && !titleType) score -= 45;
  if (/school|station|person|river|lake|unincorporated|neighborhood/.test(description)) score -= 60;
  if (/map|seal|flag|logo|coat_of_arms/i.test(page.pageprops.page_image_free)) score -= 100;
  return score;
};

const commonsMetadata = async (fileName) => {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({
    action: "query",
    titles: `File:${fileName}`,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const payload = await fetchJson(url, "Commons metadata");
  const page = Object.values(payload.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const metadata = info.extmetadata || {};
  return {
    commonsTitle: page.title,
    sourceUrl: info.descriptionurl,
    downloadUrl: info.thumburl || info.url,
    originalUrl: info.url,
    width: info.width,
    height: info.height,
    credit: decodeHtml(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor")
      .replace(/\s*\(if there is an issue with this image.*$/i, "")
      .replace(/,\s*"by Someuser.*$/i, "")
      .trim(),
    license: decodeHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || ""),
    licenseUrl: metadata.LicenseUrl?.value || "",
    description: decodeHtml(metadata.ImageDescription?.value || ""),
    categories: decodeHtml(metadata.Categories?.value || ""),
  };
};

const allowedLicense = (candidate) => {
  const license = candidate?.license?.toLowerCase() || "";
  return Boolean(candidate?.sourceUrl && candidate?.downloadUrl && candidate?.credit)
    && !license.includes("noncommercial")
    && !license.includes("no derivatives")
    && (license.includes("cc by") || license.includes("cc0") || license.includes("public domain"));
};

const pages = await parseGeneratedPages();
const towns = pages.flatMap((page) => (page.sections || [])
  .filter((section) => section.kind === "town")
  .map((section) => ({
    countyPath: page.path,
    county: countyNames.get(page.path),
    sectionId: section.id,
    name: section.blocks.find((block) => /^H[1-6]$/.test(block.tag))?.text || section.id,
    currentSrc: section.images[0]?.src || "",
    currentAlt: section.images[0]?.alt || "",
  })));

await mkdir(outputDir, { recursive: true });
const results = [];
for (const [index, town] of towns.entries()) {
  const searchName = searchOverrides.get(town.name) || town.name;
  try {
    const fileOverride = fileOverrides.get(`${town.name}|${town.county}`)
      || fileOverrides.get(town.name);
    if (fileOverride) {
      const metadata = await commonsMetadata(fileOverride);
      results.push({
        ...town,
        searchName,
        wikipediaTitle: "",
        score: 1000,
        candidate: allowedLicense(metadata) ? metadata : null,
        rejectedCandidate: metadata && !allowedLicense(metadata) ? metadata : null,
      });
      process.stdout.write(`\rSourced ${index + 1}/${towns.length}`);
      await sleep(60);
      continue;
    }
    const pagesFound = await wikipediaSearch(searchName, town.county);
    const ranked = pagesFound
      .map((page) => ({ page, score: scorePage(page, searchName, town.county) }))
      .sort((left, right) => right.score - left.score);
    const selected = ranked[0];
    const metadata = selected?.score >= 80
      ? await commonsMetadata(selected.page.pageprops.page_image_free)
      : null;
    results.push({
      ...town,
      searchName,
      wikipediaTitle: selected?.page.title || "",
      score: selected?.score || 0,
      candidate: allowedLicense(metadata) ? metadata : null,
      rejectedCandidate: metadata && !allowedLicense(metadata) ? metadata : null,
    });
  } catch (error) {
    results.push({ ...town, searchName, error: error instanceof Error ? error.message : String(error), candidate: null });
  }
  process.stdout.write(`\rSourced ${index + 1}/${towns.length}`);
  await sleep(60);
}
process.stdout.write("\n");

const outputPath = path.join(outputDir, "community-image-candidates.json");
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
const coverage = results.filter((result) => result.candidate).length;
console.log(`Found ${coverage} reusable candidates for ${results.length} community cards.`);
console.log(`Wrote ${outputPath}`);
