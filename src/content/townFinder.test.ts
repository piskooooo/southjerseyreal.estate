import { describe, expect, it } from "vitest";
import { applyCommunityProfiles } from "./communityProfiles";
import { generatedPages } from "./generatedSiteData";
import { buildTownFinderEntries, findTownFinderEntries, type TownFinderEntry } from "./townFinder";
import type { PageSection, SitePage } from "./types";

const town = (id: string, name: string): PageSection => ({
  id,
  kind: "town",
  blocks: [{ tag: "H3", text: name }, { tag: "P", text: "A town introduction." }],
  images: [],
});

const county = (path: string, sections: PageSection[]): SitePage => ({ path, title: "County", sections });
const seededEntries = buildTownFinderEntries(applyCommunityProfiles(generatedPages));

describe("town finder entries", () => {
  it("indexes all 166 seeded profiles across the seven counties, keeping combined profiles intact", () => {
    expect(seededEntries).toHaveLength(166);
    expect(new Set(seededEntries.map((entry) => entry.key)).size).toBe(166);
    expect(new Set(seededEntries.map((entry) => entry.href)).size).toBe(166);
    expect(seededEntries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.county] = (counts[entry.county] || 0) + 1;
      return counts;
    }, {})).toEqual({
      "Atlantic County": 23,
      "Burlington County": 40,
      "Camden County": 34,
      "Cape May County": 16,
      "Cumberland County": 14,
      "Gloucester County": 24,
      "Salem County": 15,
    });
    expect(findTownFinderEntries(seededEntries, "Audubon Park").map((entry) => entry.name))
      .toEqual(["Audubon and Audubon Park"]);
    expect(findTownFinderEntries(seededEntries, "Pine Valley").map((entry) => entry.name))
      .toEqual(["Pine Hill (including the former Pine Valley Borough)"]);
  });

  it("keeps same-named towns distinct and uses county labels to disambiguate them", () => {
    const matches = findTownFinderEntries(seededEntries, "Greenwich Township")
      .filter((entry) => entry.name === "Greenwich Township");
    expect(matches.map((entry) => entry.county)).toEqual(["Cumberland County", "Gloucester County"]);
    expect(matches[0].key).not.toBe(matches[1].key);
    expect(matches.map((entry) => entry.href)).toEqual([
      "/cumberland-county#greenwich-township",
      "/gloucester-county#greenwich-township",
    ]);
    expect(findTownFinderEntries(seededEntries, "Greenwich Cumberland")).toEqual([matches[0]]);
    expect(findTownFinderEntries(seededEntries, "Franklin Gloucester").map((entry) => entry.name))
      .toEqual(["Franklin Township"]);
    expect(findTownFinderEntries(seededEntries, "Gloucester Franklin").map((entry) => entry.name))
      .toEqual(["Franklin Township"]);
  });

  it("uses only the accepted pages, reflecting owner renames, removals and newly added towns", () => {
    const page = county("/camden-county", [town("first", "Original Town"), town("removed", "Removed Town")]);
    const originalKey = buildTownFinderEntries([page])[0].key;
    const renamed = structuredClone(page.sections[0]);
    renamed.blocks[0].text = "Reviewed Town & Village";
    page.sections = [town("new", "Added Town"), renamed];
    const before = structuredClone(page);

    const entries = buildTownFinderEntries(new Map([[page.path, page]]).values());
    expect(entries).toEqual([
      { key: "/camden-county:new", name: "Added Town", county: "Camden County", href: "/camden-county#added-town" },
      { key: originalKey, name: "Reviewed Town & Village", county: "Camden County", href: "/camden-county#reviewed-town-village" },
    ]);
    expect(page).toEqual(before);
    expect(findTownFinderEntries(entries, "Removed")).toEqual([]);
    expect(findTownFinderEntries(entries, "Original")).toEqual([]);
    expect(buildTownFinderEntries([])).toEqual([]);
  });

  it("shares legacy town detection and fallback identifiers while skipping blank headings and other routes", () => {
    const image = { src: "/town.webp", alt: "Town" };
    const page = county("/camden-county", [
      { id: "intro", images: [image], blocks: [{ tag: "H2", text: "County introduction" }] },
      { id: "action", images: [image], blocks: [{ tag: "H2", text: "Thinking of Selling?" }, { tag: "H2", text: "Looking to Buy?" }] },
      { id: "", images: [image], blocks: [{ tag: "H4", text: "Legacy Town" }] },
      town("explicit", "Explicit Town"),
      town("empty", " \n\t "),
      { id: "no-heading", kind: "town", images: [], blocks: [{ tag: "P", text: "No town heading" }] },
    ]);
    expect(buildTownFinderEntries([page, county("/about", [town("other", "Unrelated Town")])])).toEqual([
      { key: "/camden-county:explicit", name: "Explicit Town", county: "Camden County", href: "/camden-county#explicit-town" },
      { key: "/camden-county:2", name: "Legacy Town", county: "Camden County", href: "/camden-county#community-3" },
    ]);
  });

  it("sorts by town and county regardless of page or section order", () => {
    const pages = [
      county("/gloucester-county", [town("g", "Shared Town"), town("z", "Zeta")]),
      county("/camden-county", [town("c", "Shared Town"), town("a", "Alpha")]),
    ];
    const expected = ["Alpha / Camden County", "Shared Town / Camden County", "Shared Town / Gloucester County", "Zeta / Gloucester County"];
    expect(buildTownFinderEntries(pages).map((entry) => `${entry.name} / ${entry.county}`)).toEqual(expected);
    expect(buildTownFinderEntries([...pages].reverse()).map((entry) => `${entry.name} / ${entry.county}`)).toEqual(expected);
  });
});

describe("town finder matching", () => {
  it.each(["BassRiver", "BASS RIVER", "  bass   river  ", "bass-river", "Báss—Ríver"])(
    "finds Bass River with normalized query %s",
    (query) => {
      expect(findTownFinderEntries(seededEntries, query).map((entry) => entry.name))
        .toEqual(["Bass River Township"]);
    },
  );

  it("matches accents and punctuation in owner-written headings as well as queries", () => {
    const entries = buildTownFinderEntries([county("/atlantic-county", [town("accent", "Café–Point")])]);
    expect(findTownFinderEntries(entries, "CAFE POINT atlantic")).toEqual(entries);
    expect(findTownFinderEntries(entries, "cafepoint")).toEqual(entries);
  });

  it.each([
    { query: "Mt Laurel", name: "Mount Laurel Township", href: "/burlington-county#mount-laurel-township" },
    { query: "MT. LAUREL", name: "Mount Laurel Township", href: "/burlington-county#mount-laurel-township" },
    { query: "Mt. Holly", name: "Mount Holly Township", href: "/burlington-county#mount-holly-township" },
    { query: "Egg Harbor Twp", name: "Egg Harbor Township", href: "/atlantic-county#egg-harbor-township" },
    { query: "EGG HARBOR TWP.", name: "Egg Harbor Township", href: "/atlantic-county#egg-harbor-township" },
  ])("finds the existing profile for $query", ({ query, name, href }) => {
    expect(findTownFinderEntries(seededEntries, query)).toEqual([
      expect.objectContaining({ name, href }),
    ]);
  });

  it("matches full-form queries against accepted abbreviated headings without restoring renamed or removed towns", () => {
    const page = county("/burlington-county", [town("laurel", "Mt. Laurel Twp.")]);
    const entries = buildTownFinderEntries([page]);
    const before = structuredClone(entries);
    expect(findTownFinderEntries(entries, "Mount Laurel Township")).toEqual([
      { key: "/burlington-county:laurel", name: "Mt. Laurel Twp.", county: "Burlington County", href: "/burlington-county#mt-laurel-twp" },
    ]);
    expect(entries).toEqual(before);

    page.sections[0].blocks[0].text = "Reviewed Community";
    expect(findTownFinderEntries(buildTownFinderEntries([page]), "Mt Laurel")).toEqual([]);
    page.sections = [];
    expect(findTownFinderEntries(buildTownFinderEntries([page]), "Mount Laurel Township")).toEqual([]);
  });

  it("keeps county disambiguation for abbreviated township queries", () => {
    const matches = findTownFinderEntries(seededEntries, "Washington Twp.");
    expect(matches).toEqual(findTownFinderEntries(seededEntries, "Washington Township"));
    expect(matches.map((entry) => entry.county).sort()).toEqual(["Burlington County", "Gloucester County"]);
    expect(findTownFinderEntries(seededEntries, "Washington Twp Gloucester")).toEqual([
      expect.objectContaining({ county: "Gloucester County", href: "/gloucester-county#washington-township" }),
    ]);
  });

  it("keeps exact, prefix and other result ranking for abbreviated queries", () => {
    const entries: readonly TownFinderEntry[] = Object.freeze([
      { key: "contains", name: "North Mount Laurel", county: "Camden County", href: "/camden-county#north-mount-laurel" },
      { key: "prefix", name: "Mount Laurel Township", county: "Burlington County", href: "/burlington-county#mount-laurel-township" },
      { key: "exact", name: "Mount Laurel", county: "Burlington County", href: "/burlington-county#mount-laurel" },
    ]);
    const before = structuredClone(entries);
    expect(findTownFinderEntries(entries, "Mt. Laurel").map((entry) => entry.key))
      .toEqual(["exact", "prefix", "contains"]);
    expect(entries).toEqual(before);
  });

  it("does not expand abbreviation letters inside longer words", () => {
    const entries = buildTownFinderEntries([county("/camden-county", [town("mt", "Mtville"), town("twp", "Twpville")])]);
    expect(findTownFinderEntries(entries, "Mountville")).toEqual([]);
    expect(findTownFinderEntries(entries, "Townshipville")).toEqual([]);
    expect(findTownFinderEntries(entries, "Mtville").map((entry) => entry.name)).toEqual(["Mtville"]);
    expect(findTownFinderEntries(entries, "Twpville").map((entry) => entry.name)).toEqual(["Twpville"]);
  });

  it.each(["", " \n\t ", "— & / ...", "No Such Town", "Bass River Camden"])(
    "returns no matches for %j",
    (query) => expect(findTownFinderEntries(seededEntries, query)).toEqual([]),
  );

  it("puts exact and name-prefix matches first without changing the input or capping the results", () => {
    const entries: readonly TownFinderEntry[] = Object.freeze([
      { key: "county", name: "Elsewhere", county: "River County", href: "/county#elsewhere" },
      { key: "contains", name: "North River", county: "Camden County", href: "/camden-county#north-river" },
      { key: "prefix", name: "Riverton", county: "Camden County", href: "/camden-county#riverton" },
      { key: "exact", name: "River", county: "Camden County", href: "/camden-county#river" },
    ]);
    const before = structuredClone(entries);
    expect(findTownFinderEntries(entries, "river").map((entry) => entry.key))
      .toEqual(["exact", "prefix", "county", "contains"]);
    expect(entries).toEqual(before);
    expect(findTownFinderEntries(seededEntries, "Burlington County")).toHaveLength(40);
  });
});
