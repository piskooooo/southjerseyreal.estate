import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRevision = "617b660";
const sourceFile = "src/content/generatedSiteData.ts";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const outputPath = path.join(root, "src", "content", "communityDetails.json");
const countyPaths = new Set([
  "/atlantic-county",
  "/burlington-county",
  "/camden-county",
  "/cape-may-county",
  "/cumberland-county",
  "/gloucester-county",
  "/salem-county",
]);
const retainedLabels = new Set([
  "Population",
  "Government",
  "Services",
  "Median Sold Price",
  "Average Property Tax",
  "Schools",
  "Parks & Recreation",
  "Shopping & Dining",
  "Transportation",
]);
const unsafeCopy = /family[- ]friendly|famil(?:y|ies)|young professionals?|retirees?|empty nesters?|safe(?:st)?|low crime|great schools?|excellent schools?|strong schools?|reputable schools?|best school|good schools?|well-regarded|well-ranked|most sought[- ]after|exclusive|exclusivity|prestigious|perfect|ideal|top[- ]rated|top choice|desirable|welcoming|appeal(?:s|ing)? to|buyers? who|homebuyers?/i;

const source = execFileSync("git", ["show", `${sourceRevision}:${sourceFile}`], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 30 * 1024 * 1024,
});
const assignmentStart = source.indexOf("=", source.indexOf("export const generatedPages"));
const jsonStart = source.indexOf("[", assignmentStart);
const jsonEnd = source.lastIndexOf("];");
if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error("Could not locate historical generatedPages data.");
const pages = JSON.parse(source.slice(jsonStart, jsonEnd + 1));

const cleanFact = (text) => {
  const separator = text.indexOf(":");
  if (separator < 0) return "";

  const originalLabel = text.slice(0, separator).trim();
  if (!retainedLabels.has(originalLabel)) return "";

  let value = text.slice(separator + 1).trim();
  if (!value || (originalLabel === "Median Sold Price" && /unknown/i.test(value))) return "";

  if (originalLabel === "Median Sold Price") {
    return `Median sold price (2025 site snapshot): ${value}`;
  }

  if (originalLabel === "Average Property Tax") {
    value = value.replace(/\s*\(2025\)\s*$/i, "");
    return `Average property tax (2025 site snapshot): ${value}`;
  }

  if (originalLabel === "Schools") {
    value = value
      .replace(/,?\s*including a well-regarded high school and/i, ", including")
      .replace(/,?\s*consistently ranked among New Jersey(?:'|’)s best/gi, "")
      .replace(/;?\s*the district is large and well-ranked/gi, "");
    return `Schools (2025 site snapshot): ${value}`;
  }

  const cleaned = `${originalLabel}: ${value}`
    .replace(/\bexcellent connectivity via\b/gi, "Connections include")
    .replace(/\bconvenient access to\b/gi, "Access to")
    .replace(/\beasy access to\b/gi, "Access to")
    .replace(/\bquick access to\b/gi, "Access to");

  return unsafeCopy.test(cleaned) ? "" : cleaned;
};

const counties = Object.fromEntries(
  pages
    .filter((page) => countyPaths.has(page.path))
    .map((page) => {
      const communities = page.sections
        .filter((section) => section.images?.length)
        .slice(1)
        .map((section) => {
          const title = section.blocks.find((block) => ["H2", "H3"].includes(block.tag))?.text?.trim();
          const details = section.blocks
            .filter((block) => block.tag === "P")
            .map((block) => cleanFact(block.text || ""))
            .filter(Boolean);
          if (!title || details.length < 5) {
            throw new Error(`Historical profile is incomplete on ${page.path}: ${title || "untitled section"}.`);
          }
          return { title, details };
        });

      return [page.path, communities];
    }),
);

const communityCount = Object.values(counties).reduce((total, communities) => total + communities.length, 0);
if (communityCount !== 166) throw new Error(`Expected 166 historical community profiles; found ${communityCount}.`);

await writeFile(outputPath, `${JSON.stringify({ sourceRevision, snapshotYear: 2025, counties }, null, 2)}\n`);
console.log(`Wrote structured historical details for ${communityCount} communities to ${path.relative(root, outputPath)}.`);
