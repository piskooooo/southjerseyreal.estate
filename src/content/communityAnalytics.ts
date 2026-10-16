import imageSources from "./communityImageSources.json";

// Use the reviewed public ledger and stable section IDs, never editable headings
// or a raw URL fragment, to keep analytics labels bounded and free of user text.
const slug = (value: string) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const communitiesByCounty = new Map<string, Map<string, string>>();
for (const [sectionId, community] of Object.entries(imageSources)) {
  const countyPath = `/${slug(community.county)}`;
  let communities = communitiesByCounty.get(countyPath);
  if (!communities) {
    communities = new Map();
    communitiesByCounty.set(countyPath, communities);
  }
  communities.set(sectionId, slug(community.name));
}

const allowedCommunityIds = new Map(
  Array.from(communitiesByCounty, ([path, communities]) => [path, new Set(communities.values())]),
);

export const getCommunityAnalyticsId = (countyPath: string, sectionId: string) => (
  communitiesByCounty.get(countyPath)?.get(sectionId)
);

export const isAllowedCommunityAnalyticsId = (countyPath: string, communityId: string) => (
  allowedCommunityIds.get(countyPath)?.has(communityId) === true
);
