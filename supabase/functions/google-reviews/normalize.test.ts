import { describe, expect, it } from "vitest";
import { normalizePlacesResponse } from "./normalize";

describe("Google Places response normalization", () => {
  it("preserves Google's review order, full text, and source attribution", () => {
    const firstText = "First review with all of its original wording.\nSecond line.";
    const feed = normalizePlacesResponse({
      rating: 4.8,
      userRatingCount: 24,
      googleMapsLinks: {
        reviewsUri: "https://www.google.com/maps/place/example/reviews",
        writeAReviewUri: "https://www.google.com/maps/place/example/write-review",
      },
      attributions: [{ provider: "Example Provider", providerUri: "https://example.com/data" }],
      reviews: [
        {
          name: "places/example/reviews/first",
          rating: 5,
          text: { text: firstText, languageCode: "en" },
          originalText: { text: firstText, languageCode: "en" },
          relativePublishTimeDescription: "a week ago",
          publishTime: "2026-07-01T12:00:00Z",
          authorAttribution: {
            displayName: "First Reviewer",
            uri: "https://www.google.com/maps/contrib/first",
            photoUri: "https://lh3.googleusercontent.com/first",
          },
          googleMapsUri: "https://www.google.com/maps/reviews/first",
          flagContentUri: "https://www.google.com/local/review/rap/first",
        },
        {
          name: "places/example/reviews/second",
          rating: 3,
          text: { text: "", languageCode: "en" },
          originalText: { text: "", languageCode: "en" },
          relativePublishTimeDescription: "a month ago",
          authorAttribution: {
            displayName: "Second Reviewer",
            uri: "https://www.google.com/maps/contrib/second",
            photoUri: "https://lh3.googleusercontent.com/second",
          },
          googleMapsUri: "https://www.google.com/maps/reviews/second",
        },
      ],
    });

    expect(feed.rating).toBe(4.8);
    expect(feed.userRatingCount).toBe(24);
    expect(feed.reviews.map((review) => review.id)).toEqual([
      "places/example/reviews/first",
      "places/example/reviews/second",
    ]);
    expect(feed.reviews[0].text).toBe(firstText);
    expect(feed.reviews[1].text).toBe("");
    expect(feed.attributions).toEqual([
      { provider: "Example Provider", providerUri: "https://example.com/data" },
    ]);
  });

  it("rejects unsafe attribution URLs and review entries without a source link", () => {
    const feed = normalizePlacesResponse({
      googleMapsLinks: { reviewsUri: "javascript:alert(1)" },
      attributions: [{ provider: "Unsafe", providerUri: "http://example.com" }],
      reviews: [
        { name: "missing-source", rating: 5, text: { text: "Not displayable" } },
      ],
    });

    expect(feed.reviewsUrl).toBe("");
    expect(feed.attributions).toEqual([{ provider: "Unsafe", providerUri: "" }]);
    expect(feed.reviews).toEqual([]);
  });
});
