import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const countyByPath = new Map([
  ["/atlantic-county", "Atlantic County"],
  ["/burlington-county", "Burlington County"],
  ["/camden-county", "Camden County"],
  ["/cape-may-county", "Cape May County"],
  ["/cumberland-county", "Cumberland County"],
  ["/gloucester-county", "Gloucester County"],
  ["/salem-county", "Salem County"],
]);

const countyIntroByPath = new Map([
  ["/atlantic-county", "Explore Atlantic County's shore communities, inland municipalities, and places across the mainland."],
  ["/burlington-county", "Explore communities along the Delaware River, across the county's suburban corridor, and into the Pinelands."],
  ["/camden-county", "Explore Camden County's Delaware River communities, established suburbs, and eastern townships."],
  ["/cape-may-county", "Explore Cape May County's barrier-island shore towns and mainland communities."],
  ["/cumberland-county", "Explore Cumberland County's cities and smaller communities across its agricultural, woodland, and Delaware Bay landscapes."],
  ["/gloucester-county", "Explore Gloucester County's river communities, suburban centers, and rural landscapes."],
  ["/salem-county", "Explore Salem County's small municipalities, farmland, woodland, and Delaware River and Bay communities."],
]);

const textBlock = (tag, text, href = "") => ({
  tag,
  text,
  href,
  type: "",
  placeholder: "",
});

const firstHeading = (section) => (
  section.blocks?.find((block) => ["H1", "H2", "H3"].includes(block.tag))?.text?.trim() || ""
);

const imageFor = (image, alt) => ({
  src: image?.src || "",
  alt,
});

const communityDescription = (townName, countyName) => {
  if (townName.includes("&")) return `Two communities in ${countyName}, New Jersey.`;
  if (/Township(?:\s*\(|$)/.test(townName)) return `A township in ${countyName}, New Jersey.`;
  if (/Borough(?:\s*\(|$)/.test(townName)) return `A borough in ${countyName}, New Jersey.`;
  if (/City(?:\s*\(|$)/.test(townName)) return `A city in ${countyName}, New Jersey.`;
  if (/Town(?:\s*\(|$)/.test(townName)) return `A town in ${countyName}, New Jersey.`;
  return `A municipality in ${countyName}, New Jersey.`;
};

export function sanitizeImportedPages(pages) {
  return pages.flatMap((page) => {
    const countyName = countyByPath.get(page.path);
    if (!countyName) return [];

    const [sourceIntro, ...sourceSections] = page.sections || [];
    const introImages = sourceIntro?.images?.length
      ? [imageFor(sourceIntro.images[0], `${countyName}, New Jersey locator map.`)]
      : [];
    const towns = sourceSections.flatMap((section, index) => {
      const townName = firstHeading(section);
      if (!townName || !section.images?.length) return [];

      return [{
        id: section.id || `${page.path.slice(1)}-community-${index + 1}`,
        kind: "town",
        blocks: [
          textBlock("H3", townName),
          textBlock(
            "P",
            communityDescription(townName, countyName),
          ),
        ],
        images: [imageFor(section.images[0], `Image accompanying the ${townName}, New Jersey community entry.`)],
      }];
    });

    return [{
      path: page.path,
      title: `${countyName}, New Jersey Community Guide`,
      sections: [
        {
          id: sourceIntro?.id || `${page.path.slice(1)}-intro`,
          kind: "intro",
          blocks: [
            textBlock("H1", `${countyName}, New Jersey`),
            textBlock(
              "P",
              countyIntroByPath.get(page.path) || `Explore the towns and cities of ${countyName}.`,
            ),
          ],
          images: introImages,
        },
        ...towns,
        {
          id: `${page.path.slice(1)}-action`,
          kind: "action",
          blocks: [
            textBlock("H2", "Have a real estate question?"),
            textBlock(
              "P",
              "Get in touch about a property, a move, or the market.",
            ),
            textBlock("A", "Contact", "/contact"),
          ],
          images: [],
        },
      ],
    }];
  });
}

export function serializeGeneratedPages(pages) {
  return `// Generated from imported site data and curated into concise county directories.\n// Rerun npm run import:live only with a fresh source extraction and a content review.\nimport type { SitePage } from "./types";\n\nexport const generatedPages: SitePage[] = ${JSON.stringify(pages, null, 2)};\n`;
}

async function rewriteCurrentGeneratedFile() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.join(scriptDir, "..", "src", "content", "generatedSiteData.ts");
  const source = await readFile(outputPath, "utf8");
  const assignmentStart = source.indexOf("export const generatedPages");
  const jsonStart = source.indexOf("[", source.indexOf("=", assignmentStart));
  const jsonEnd = source.lastIndexOf("];");
  if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("Could not locate generatedPages data.");
  const pages = JSON.parse(source.slice(jsonStart, jsonEnd + 1));
  const sanitized = sanitizeImportedPages(pages);
  await writeFile(outputPath, serializeGeneratedPages(sanitized));
  console.log(`Rewrote ${sanitized.length} compliance-reviewed county pages.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await rewriteCurrentGeneratedFile();
}
