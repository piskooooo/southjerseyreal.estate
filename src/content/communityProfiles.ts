import profileData from "./communityProfiles.json";
import type { ContentBlock, PageSection, SitePage } from "./types";

type CommunitySource = {
  title: string;
  href: string;
  accessed: string;
};

type CommunityProfile = {
  title: string;
  summary: string;
  sources: CommunitySource[];
};

type CountyProfile = {
  name: string;
  intro: CommunityProfile;
  communities: CommunityProfile[];
};

type CommunityProfileData = {
  updated: string;
  counties: Record<string, CountyProfile>;
};

const profiles = profileData as CommunityProfileData;

const normalizedTitle = (value: string) => value
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/\([^)]*\)/g, "")
  .replace(/[^a-z0-9]+/g, "");

const looseTitle = (value: string) => normalizedTitle(
  value.replace(/\b(?:city|borough|township|town)\b\s*(?:\([^)]*\))?$/i, ""),
);

const communityTitleAliases = new Map([
  [normalizedTitle("Pine Hill & Pine Valley"), normalizedTitle("Pine Hill")],
]);

const profileKey = (title: string) => (
  communityTitleAliases.get(normalizedTitle(title)) || normalizedTitle(title)
);

const sourceBlocks = (sources: CommunitySource[]): ContentBlock[] => sources.map((source) => ({
  tag: "SOURCE",
  text: source.title,
  href: source.href,
  accessed: source.accessed,
}));

const readableDate = (date: string) => {
  const [year, month, day] = date.split("-");
  const monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][Number(month) - 1];
  return `${monthName} ${Number(day)}, ${year}`;
};

const restoreCountyPage = (page: SitePage, county: CountyProfile): SitePage => {
  const communityByTitle = new Map(
    county.communities.map((profile) => [profileKey(profile.title), profile]),
  );
  const communityByLooseTitle = new Map<string, CommunityProfile | undefined>();
  county.communities.forEach((profile) => {
    const key = looseTitle(profile.title);
    communityByLooseTitle.set(key, communityByLooseTitle.has(key) ? undefined : profile);
  });
  const matchedProfiles = new Set<string>();

  const sections = page.sections.map((section): PageSection => {
    if (section.kind === "intro") {
      const heading = section.blocks.find((block) => ["H1", "H2", "H3"].includes(block.tag));
      return {
        ...section,
        blocks: [
          heading ? { ...heading } : { tag: "H1", text: county.name },
          { tag: "P", text: county.intro.summary },
          { tag: "P", text: `Community profiles updated ${readableDate(profiles.updated)}.` },
          ...sourceBlocks(county.intro.sources),
        ],
      };
    }

    if (section.kind !== "town") return section;
    const currentTitle = section.blocks.find((block) => ["H2", "H3"].includes(block.tag))?.text || "";
    const key = profileKey(currentTitle);
    const profile = communityByTitle.get(key) || communityByLooseTitle.get(looseTitle(currentTitle));
    if (!profile) throw new Error(`Missing sourced community profile for ${currentTitle} on ${page.path}.`);
    matchedProfiles.add(profileKey(profile.title));

    return {
      ...section,
      blocks: [
        { tag: "H3", text: profile.title },
        { tag: "P", text: profile.summary },
        ...sourceBlocks(profile.sources),
      ],
    };
  });

  if (matchedProfiles.size !== communityByTitle.size) {
    const missing = county.communities
      .filter((profile) => !matchedProfiles.has(profileKey(profile.title)))
      .map((profile) => profile.title);
    throw new Error(`Unused sourced community profiles on ${page.path}: ${missing.join(", ")}.`);
  }

  return { ...page, sections };
};

export const communityProfileUpdated = profiles.updated;

export function applyCommunityProfiles(pages: SitePage[]): SitePage[] {
  return pages.map((page) => {
    const county = profiles.counties[page.path];
    return county ? restoreCountyPage(page, county) : page;
  });
}
