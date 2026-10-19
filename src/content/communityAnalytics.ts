import reviewedCommunityIds from "./communityAnalyticsIds.json";

// Generated from the reviewed ledger; the browser receives only stable ID pairs.
// Never use editable headings or raw URL fragments as analytics labels.

const communitiesByCounty = new Map<string, Map<string, string>>();
for (const [countyPath, communities] of Object.entries(reviewedCommunityIds)) {
  communitiesByCounty.set(countyPath, new Map(Object.entries(communities)));
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
