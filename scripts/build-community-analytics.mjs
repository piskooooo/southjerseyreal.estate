import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../src/content/communityImageSources.json", import.meta.url);
const destination = new URL("../src/content/communityAnalyticsIds.json", import.meta.url);
const ledger = JSON.parse(await readFile(source, "utf8"));
const slug = (value) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) {
  throw new Error("Community analytics require the reviewed image-source ledger.");
}

const identities = Object.create(null);
let count = 0;
for (const [sectionId, community] of Object.entries(ledger)) {
  if (!sectionId || typeof community?.county !== "string" || typeof community?.name !== "string") {
    throw new Error("Community analytics require reviewed county and community names.");
  }
  const countyPath = `/${slug(community.county)}`;
  const communityId = slug(community.name);
  if (countyPath === "/" || !communityId) {
    throw new Error("Community analytics identities cannot be empty.");
  }
  identities[countyPath] ??= Object.create(null);
  identities[countyPath][sectionId] = communityId;
  count += 1;
}

const output = `${JSON.stringify(identities, null, 2)}\n`;
let previous;
try {
  previous = await readFile(destination, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (previous !== output) await writeFile(destination, output);
console.log(`Prepared ${count} community analytics IDs across ${Object.keys(identities).length} counties.`);
