import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const sourcePath = path.join(root, "docs", "community-profile-drafts.md");
const outputPath = path.join(root, "src", "content", "communityProfiles.json");

const counties = [
  ["Atlantic", "/atlantic-county", 23],
  ["Burlington", "/burlington-county", 40],
  ["Camden", "/camden-county", 34],
  ["Cape May", "/cape-may-county", 16],
  ["Cumberland", "/cumberland-county", 14],
  ["Gloucester", "/gloucester-county", 24],
  ["Salem", "/salem-county", 15],
];

const monthNumbers = new Map([
  ["january", "01"],
  ["february", "02"],
  ["march", "03"],
  ["april", "04"],
  ["may", "05"],
  ["june", "06"],
  ["july", "07"],
  ["august", "08"],
  ["september", "09"],
  ["october", "10"],
  ["november", "11"],
  ["december", "12"],
]);

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toIsoDate = (month, day, year) => {
  const monthNumber = monthNumbers.get(month.toLowerCase());
  if (!monthNumber) throw new Error(`Unknown month in source date: ${month}`);
  return `${year}-${monthNumber}-${String(day).padStart(2, "0")}`;
};

const parseAccessedDate = (text, context) => {
  const match = text.match(/accessed\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!match) throw new Error(`Missing accessed date for ${context}.`);
  return toIsoDate(match[1], match[2], match[3]);
};

const parseEntry = (title, body) => {
  const sourceStart = body.search(/^Sources?:/m);
  if (sourceStart < 0) throw new Error(`Missing source line for ${title}.`);

  const summary = body
    .slice(0, sourceStart)
    .trim()
    .replace(/\s*\n\s*/g, " ");
  const sourceText = body.slice(sourceStart).trim();
  const accessed = parseAccessedDate(sourceText, title);
  const sources = [...sourceText.matchAll(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g)].map((match) => ({
    title: match[1].trim(),
    href: match[2].trim(),
    accessed,
  }));

  if (!summary) throw new Error(`Missing summary for ${title}.`);
  if (!sources.length) throw new Error(`Missing HTTPS source link for ${title}.`);

  return { title, summary, sources };
};

const parseHeadingEntries = (body) => (
  [...body.matchAll(/^### (.+)[^\S\r\n]*\r?\n([\s\S]*?)(?=^### |^## |$(?![\s\S]))/gm)]
    .map((match) => parseEntry(match[1].trim(), match[2]))
);

const sectionBody = (markdown, heading) => {
  const pattern = new RegExp(`^## ${escapePattern(heading)}[^\\S\\r\\n]*\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m");
  const match = markdown.match(pattern);
  if (!match) throw new Error(`Missing section: ${heading}`);
  return match[1];
};

const markdown = await readFile(sourcePath, "utf8");
const researchedMatch = markdown.match(/^Last researched:\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/m);
if (!researchedMatch) throw new Error("Missing Last researched date.");
const updated = toIsoDate(researchedMatch[1], researchedMatch[2], researchedMatch[3]);

const introEntries = new Map(
  parseHeadingEntries(sectionBody(markdown, "County Introduction Drafts"))
    .map((entry) => [entry.title, entry]),
);

const countyProfiles = Object.fromEntries(counties.map(([county, route, expectedCount]) => {
  const name = `${county} County`;
  const intro = introEntries.get(name);
  if (!intro) throw new Error(`Missing county introduction: ${name}`);

  const communities = parseHeadingEntries(sectionBody(markdown, `${name} Draft`));
  if (communities.length !== expectedCount) {
    throw new Error(`${name} has ${communities.length} profiles; expected ${expectedCount}.`);
  }

  return [route, { name, intro, communities }];
}));

const profileCount = Object.values(countyProfiles)
  .reduce((total, county) => total + county.communities.length, 0);
if (profileCount !== 166) throw new Error(`Expected 166 community profiles; found ${profileCount}.`);

await writeFile(outputPath, `${JSON.stringify({ updated, counties: countyProfiles }, null, 2)}\n`);
console.log(`Wrote ${profileCount} sourced community profiles to ${path.relative(root, outputPath)}.`);
