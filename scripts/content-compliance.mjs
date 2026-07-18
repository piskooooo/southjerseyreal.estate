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
            `A community included in this ${countyName} guide. Check current public information with the relevant municipality or county before making a real-estate decision.`,
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
              `This guide provides a directory of communities associated with ${countyName}. It does not rank communities or make claims about who should live in them.`,
            ),
          ],
          images: introImages,
        },
        ...towns,
        {
          id: `${page.path.slice(1)}-action`,
          kind: "action",
          blocks: [
            textBlock("H2", "Planning a move in New Jersey?"),
            textBlock(
              "P",
              "Arthur helps New Jersey buyers and sellers plan, communicate, and manage the steps of a residential real-estate transaction.",
            ),
            textBlock("A", "Start the Conversation", "/contact"),
          ],
          images: [],
        },
      ],
    }];
  });
}

export function serializeGeneratedPages(pages) {
  return `// Generated from imported site data and reduced to compliance-reviewed county structure.\n// Rerun npm run import:live only with a fresh source extraction; imported marketing copy is not published.\nimport type { SitePage } from "./types";\n\nexport const generatedPages: SitePage[] = ${JSON.stringify(pages, null, 2)};\n`;
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
