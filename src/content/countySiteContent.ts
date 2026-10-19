import { applyCommunityProfiles } from "./communityProfiles";
import { COMMUNITY_SUMMARIES_VERSION, upgradeCommunitySummaries } from "./communitySummaryRevisions";
import { generatedPages } from "./generatedSiteData";
import type { CountySiteContent } from "./managedContentRuntime";

// The full county material stays available synchronously to builds/editor, and
// is a separate, cached import for public visits that need county content.
export const countySiteContent: CountySiteContent = {
  pages: applyCommunityProfiles(generatedPages),
  communitySummariesVersion: COMMUNITY_SUMMARIES_VERSION,
  upgradeCommunitySummaries,
};
