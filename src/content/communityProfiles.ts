import detailData from "./communityDetails.json";
import imageData from "./communityImageSources.json";
import profileData from "./communityProfiles.json";
import type { ContentBlock, ImageAsset, PageSection, SitePage } from "./types";

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

type CommunityDetail = {
  title: string;
  details: string[];
};

type CommunityDetailData = {
  sourceRevision: string;
  snapshotYear: number;
  counties: Record<string, CommunityDetail[]>;
};

type CommunityImageSource = Pick<
  ImageAsset,
  "src" | "alt" | "credit" | "sourceUrl" | "license" | "licenseUrl"
> & {
  name: string;
  county: string;
  originalFile: string;
  originalUrl: string;
  reviewedAt: string;
};

const profiles = profileData as CommunityProfileData;
const historicalDetails = detailData as CommunityDetailData;
const communityImages = imageData as Record<string, CommunityImageSource>;

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

const uniqueLooseTitleMap = <T extends { title: string }>(items: T[]) => {
  const result = new Map<string, T | undefined>();
  items.forEach((item) => {
    const key = looseTitle(item.title);
    result.set(key, result.has(key) ? undefined : item);
  });
  return result;
};

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

const restoreCountyPage = (page: SitePage, county: CountyProfile, details: CommunityDetail[]): SitePage => {
  const communityByTitle = new Map(
    county.communities.map((profile) => [profileKey(profile.title), profile]),
  );
  const communityByLooseTitle = uniqueLooseTitleMap(county.communities);
  const detailsByTitle = new Map(details.map((detail) => [profileKey(detail.title), detail]));
  const detailsByLooseTitle = uniqueLooseTitleMap(details);
  const matchedProfiles = new Set<string>();
  const matchedDetails = new Set<string>();

  const sections = page.sections.map((section): PageSection => {
    if (section.kind === "intro") {
      const heading = section.blocks.find((block) => ["H1", "H2", "H3"].includes(block.tag));
      return {
        ...section,
        blocks: [
          heading ? { ...heading } : { tag: "H1", text: county.name },
          { tag: "P", text: county.intro.summary },
          { tag: "P", text: `Community profiles updated ${readableDate(profiles.updated)}.` },
          {
            tag: "P",
            text: `Expanded profiles retain the original site's detailed community snapshot. Population is labeled from the 2020 Census; price, tax, and school fields are labeled as ${historicalDetails.snapshotYear} snapshots rather than current figures.`,
          },
          ...sourceBlocks(county.intro.sources),
        ],
      };
    }

    if (section.kind !== "town") return section;
    const currentTitle = section.blocks.find((block) => ["H2", "H3"].includes(block.tag))?.text || "";
    const key = profileKey(currentTitle);
    const profile = communityByTitle.get(key) || communityByLooseTitle.get(looseTitle(currentTitle));
    if (!profile) throw new Error(`Missing sourced community profile for ${currentTitle} on ${page.path}.`);
    const detail = detailsByTitle.get(key) || detailsByLooseTitle.get(looseTitle(currentTitle));
    if (!detail) throw new Error(`Missing historical community details for ${currentTitle} on ${page.path}.`);
    matchedProfiles.add(profileKey(profile.title));
    matchedDetails.add(profileKey(detail.title));
    const curatedImage = communityImages[section.id];
    if (!curatedImage) throw new Error(`Missing curated community image for ${currentTitle} on ${page.path}.`);

    return {
      ...section,
      blocks: [
        { tag: "H3", text: profile.title },
        { tag: "P", text: profile.summary },
        ...detail.details.map((text) => ({ tag: "P", text })),
        ...sourceBlocks(profile.sources),
      ],
      images: [{
        src: curatedImage.src,
        alt: curatedImage.alt,
        credit: curatedImage.credit,
        sourceUrl: curatedImage.sourceUrl,
        license: curatedImage.license,
        licenseUrl: curatedImage.licenseUrl,
      }],
    };
  });

  if (matchedProfiles.size !== communityByTitle.size) {
    const missing = county.communities
      .filter((profile) => !matchedProfiles.has(profileKey(profile.title)))
      .map((profile) => profile.title);
    throw new Error(`Unused sourced community profiles on ${page.path}: ${missing.join(", ")}.`);
  }

  if (matchedDetails.size !== detailsByTitle.size) {
    const missing = details
      .filter((detail) => !matchedDetails.has(profileKey(detail.title)))
      .map((detail) => detail.title);
    throw new Error(`Unused historical community details on ${page.path}: ${missing.join(", ")}.`);
  }

  return { ...page, title: `${county.name}, New Jersey Real Estate and Local Information`, sections };
};

export const communityProfileUpdated = profiles.updated;
export const communityDetailSnapshotYear = historicalDetails.snapshotYear;

export function applyCommunityProfiles(pages: SitePage[]): SitePage[] {
  return pages.map((page) => {
    const county = profiles.counties[page.path];
    const details = historicalDetails.counties[page.path];
    return county ? restoreCountyPage(page, county, details || []) : page;
  });
}
