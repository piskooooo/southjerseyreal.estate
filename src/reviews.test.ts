import { afterEach, describe, expect, it, vi } from "vitest";
import { loadGoogleReviews } from "./reviews";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

const review = {
  id: "places/example/reviews/one",
  rating: 5,
  text: "Clear and helpful throughout the process.",
  relativePublishTimeDescription: "a month ago",
  publishTime: "2026-06-01T12:00:00Z",
  translated: false,
  author: {
    displayName: "Test Reviewer",
    uri: "https://www.google.com/maps/contrib/example",
    photoUri: "https://lh3.googleusercontent.com/example",
  },
  googleMapsUri: "https://www.google.com/maps/reviews/example",
  flagContentUri: "https://www.google.com/local/review/rap/report",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Google review feed client", () => {
  it("loads and validates the public review response without caching it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      rating: 4.9,
      userRatingCount: 12,
      reviewsUrl: "https://www.google.com/maps/place/example/reviews",
      writeReviewUrl: "https://www.google.com/maps/place/example/write-review",
      attributions: [],
      reviews: [review],
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadGoogleReviews()).resolves.toMatchObject({
      rating: 4.9,
      userRatingCount: 12,
      reviews: [review],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test-project.supabase.co/functions/v1/google-reviews",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
  });

  it("preserves the bounded function error code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      ok: false,
      code: "provider_unavailable",
    }, 503)));

    await expect(loadGoogleReviews()).rejects.toMatchObject({
      code: "provider_unavailable",
    });
  });

  it("rejects malformed review data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      ok: true,
      reviews: [{ ...review, googleMapsUri: 42 }],
    })));

    await expect(loadGoogleReviews()).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
});
