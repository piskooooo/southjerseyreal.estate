// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PageSection } from "../content/types";
import { AboutReviewsSection } from "./Reviews";

const section: PageSection = {
  id: "about-reviews",
  kind: "promo",
  blocks: [
    { tag: "H2", text: "Client feedback" },
    { tag: "P", text: "Public feedback linked to its original source." },
  ],
  images: [],
};

const reviewPayload = {
  ok: true,
  rating: 5,
  userRatingCount: 8,
  reviewsUrl: "https://www.google.com/maps/place/example/reviews",
  writeReviewUrl: "",
  attributions: [],
  reviews: [
    {
      id: "places/example/reviews/one",
      rating: 5,
      text: "Arthur kept the process clear from beginning to end.",
      relativePublishTimeDescription: "2 months ago",
      publishTime: "2026-05-01T12:00:00Z",
      translated: false,
      author: {
        displayName: "Test Reviewer",
        uri: "https://www.google.com/maps/contrib/example",
        photoUri: "https://lh3.googleusercontent.com/example",
      },
      googleMapsUri: "https://www.google.com/maps/reviews/example",
      flagContentUri: "https://www.google.com/local/review/rap/report",
    },
    {
      id: "places/example/reviews/one-star",
      rating: 1,
      text: "This one-star review must not appear in the website display.",
      relativePublishTimeDescription: "1 month ago",
      publishTime: "2026-06-01T12:00:00Z",
      translated: false,
      author: {
        displayName: "Low Rating Reviewer",
        uri: "https://www.google.com/maps/contrib/low-rating",
        photoUri: "https://lh3.googleusercontent.com/low-rating",
      },
      googleMapsUri: "https://www.google.com/maps/reviews/low-rating",
      flagContentUri: "https://www.google.com/local/review/rap/low-rating",
    },
  ],
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

describe("About page reviews", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders attributed Google content and every public review source", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(reviewPayload));
    render(<AboutReviewsSection section={section} navigate={vi.fn()} />);

    expect(await screen.findByText(reviewPayload.reviews[0].text)).toBeVisible();
    expect(screen.getByText("Google Maps")).toBeVisible();
    expect(screen.getByRole("link", { name: /Test Reviewer/ })).toHaveAttribute(
      "href",
      reviewPayload.reviews[0].author.uri,
    );
    expect(screen.getByRole("link", { name: "View on Google Maps" })).toHaveAttribute(
      "href",
      reviewPayload.reviews[0].googleMapsUri,
    );
    expect(screen.getByText(/displays returned reviews rated 4 or 5 stars/)).toBeVisible();
    expect(screen.queryByText(reviewPayload.reviews[1].text)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Facebook Recommendations/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Zillow Profile/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Realtor.com Profile/ })).toBeVisible();
  });

  it("falls back to the Google profile when the function is unavailable", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      ok: false,
      code: "configuration_error",
    }, 503));
    render(<AboutReviewsSection section={section} navigate={vi.fn()} />);

    expect(await screen.findByText("Read the reviews on Google")).toBeVisible();
    expect(screen.getByRole("link", { name: /Open Google Reviews/ })).toHaveAttribute(
      "href",
      "https://g.co/kgs/xMPHGmV",
    );
  });
});
