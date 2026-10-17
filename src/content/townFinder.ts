import { isTownSection, townSectionAnchor, townSectionKey } from "./countySections";
import { countyNav } from "./navigation";
import type { SitePage } from "./types";

export type TownFinderEntry = {
  key: string;
  name: string;
  county: string;
  href: string;
};

const countyNames = new Map(countyNav.map(({ path, label }) => [path, `${label} County`]));
const nameOrder = new Intl.Collator("en", { sensitivity: "base" });

const compareText = (left: string, right: string) => (
  nameOrder.compare(left, right) || (left < right ? -1 : left > right ? 1 : 0)
);

const compareEntries = (left: TownFinderEntry, right: TownFinderEntry) => (
  compareText(left.name, right.name)
  || compareText(left.county, right.county)
  || compareText(left.key, right.key)
);

const normalizeSearch = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const compactSearch = (value: string) => value.replace(/ /g, "");

export function buildTownFinderEntries(pages: Iterable<SitePage>): TownFinderEntry[] {
  const entries: TownFinderEntry[] = [];

  for (const page of pages) {
    const county = countyNames.get(page.path);
    if (!county) continue;

    page.sections.forEach((section, index) => {
      if (!isTownSection(section, index)) return;
      const name = section.blocks.find((block) => /^H[1-6]$/.test(block.tag))?.text.trim();
      if (!name) return;

      entries.push({
        key: `${page.path}:${townSectionKey(section, index)}`,
        name,
        county,
        href: `${page.path}#${townSectionAnchor(section, index)}`,
      });
    });
  }

  return entries.sort(compareEntries);
}

export function findTownFinderEntries(
  entries: readonly TownFinderEntry[],
  query: string,
): TownFinderEntry[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];
  const tokens = normalizedQuery.split(" ");
  const compactQuery = compactSearch(normalizedQuery);

  return entries.flatMap((entry) => {
    const name = normalizeSearch(entry.name);
    const county = normalizeSearch(entry.county);
    const compactName = compactSearch(name);
    const compactCounty = compactSearch(county);
    if (!tokens.every((token) => compactName.includes(token) || compactCounty.includes(token))) {
      return [];
    }

    const rank = compactName === compactQuery ? 0 : compactName.startsWith(compactQuery) ? 1 : 2;
    return [{ entry, rank }];
  }).sort((left, right) => left.rank - right.rank || compareEntries(left.entry, right.entry))
    .map(({ entry }) => entry);
}
