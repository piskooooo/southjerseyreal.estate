import { describe, expect, it } from "vitest";
import imageSources from "./communityImageSources.json";
import reviewedCommunityIds from "./communityAnalyticsIds.json";
import { getCommunityAnalyticsId, isAllowedCommunityAnalyticsId } from "./communityAnalytics";

const slug = (value: string) => value.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const expected = Object.entries(imageSources).reduce<Record<string, Record<string, string>>>((counties, [sectionId, community]) => {
  const path = `/${slug(community.county)}`;
  (counties[path] ??= {})[sectionId] = slug(community.name);
  return counties;
}, {});

describe("reviewed community analytics identities", () => {
  it("keeps exact parity with every reviewed ledger identity and no image metadata", () => {
    expect(reviewedCommunityIds).toEqual(expected);
    expect(Object.values(reviewedCommunityIds).flatMap((communities) => Object.entries(communities)))
      .toHaveLength(Object.keys(imageSources).length);
    for (const [countyPath, communities] of Object.entries(expected)) {
      for (const [sectionId, communityId] of Object.entries(communities)) {
        expect(getCommunityAnalyticsId(countyPath, sectionId)).toBe(communityId);
        expect(isAllowedCommunityAnalyticsId(countyPath, communityId)).toBe(true);
      }
    }
  });

  it("preserves controlled legacy section IDs without deriving labels from user text", () => {
    expect(getCommunityAnalyticsId("/gloucester-county", "woolwich-township-normalized")).toBe("woolwich-township");
    expect(getCommunityAnalyticsId("/atlantic-county", "67eb41c1252f4e00f739930c")).toBe("absecon");
    expect(getCommunityAnalyticsId("/gloucester-county", "Woolwich Township")).toBeUndefined();
    expect(getCommunityAnalyticsId("/gloucester-county", "#woolwich-township")).toBeUndefined();
    expect(getCommunityAnalyticsId("/atlantic-county", "unreviewed-section")).toBeUndefined();
    expect(getCommunityAnalyticsId("/unknown-county", "67eb41c1252f4e00f739930c")).toBeUndefined();
  });

  it("allows only the exact reviewed county and public community ID combinations", () => {
    const allIds = new Set(Object.values(expected).flatMap((communities) => Object.values(communities)));
    for (const [countyPath, communities] of Object.entries(expected)) {
      const allowed = new Set(Object.values(communities));
      for (const communityId of allIds) {
        expect(isAllowedCommunityAnalyticsId(countyPath, communityId)).toBe(allowed.has(communityId));
      }
    }
    for (const [countyPath, communityId] of [
      ["/unknown-county", "absecon"],
      ["atlantic-county", "absecon"],
      ["/Atlantic-County", "absecon"],
      ["/atlantic-county", "Absecon"],
      ["/atlantic-county", "#absecon"],
      ["/atlantic-county", "absecon?query=unreviewed"],
      ["/atlantic-county", "unreviewed-town"],
    ]) {
      expect(isAllowedCommunityAnalyticsId(countyPath, communityId)).toBe(false);
    }
  });
});
