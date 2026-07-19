const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 12_000;

export const reviewProfileLinks = [
  {
    key: "google",
    label: "Google Reviews",
    href: "https://g.co/kgs/xMPHGmV",
  },
  {
    key: "facebook",
    label: "Facebook Recommendations",
    href: "https://www.facebook.com/arthurpiskoREA/reviews",
  },
  {
    key: "zillow",
    label: "Zillow Profile",
    href: "https://www.zillow.com/profile/arthurpisko",
  },
  {
    key: "realtor",
    label: "Realtor.com Profile",
    href: "https://www.realtor.com/realestateagents/659c35c962a5ff070b97f4b8",
  },
] as const;

export type GoogleReview = {
  id: string;
  rating: number;
  text: string;
  relativePublishTimeDescription: string;
  publishTime: string;
  translated: boolean;
  author: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
  googleMapsUri: string;
  flagContentUri: string;
};

export type GoogleReviewFeed = {
  rating: number | null;
  userRatingCount: number | null;
  reviewsUrl: string;
  writeReviewUrl: string;
  attributions: Array<{ provider: string; providerUri: string }>;
  reviews: GoogleReview[];
};

type ReviewFunctionResponse = Partial<GoogleReviewFeed> & {
  ok?: boolean;
  code?: string;
};

export class ReviewFeedError extends Error {
  readonly code: string;

  constructor(code = "unknown") {
    super("Review feed request failed.");
    this.name = "ReviewFeedError";
    this.code = code;
  }
}

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === "number" && Number.isFinite(value)
);

const isString = (value: unknown): value is string => typeof value === "string";

const isGoogleReview = (value: unknown): value is GoogleReview => {
  if (!value || typeof value !== "object") return false;
  const review = value as Partial<GoogleReview>;
  return isString(review.id)
    && isFiniteNumber(review.rating)
    && isString(review.text)
    && isString(review.relativePublishTimeDescription)
    && isString(review.publishTime)
    && typeof review.translated === "boolean"
    && Boolean(review.author)
    && isString(review.author?.displayName)
    && isString(review.author?.uri)
    && isString(review.author?.photoUri)
    && isString(review.googleMapsUri)
    && isString(review.flagContentUri);
};

const normalizeFeed = (payload: ReviewFunctionResponse): GoogleReviewFeed => {
  if (!Array.isArray(payload.reviews) || !payload.reviews.every(isGoogleReview)) {
    throw new ReviewFeedError("invalid_response");
  }

  return {
    rating: payload.rating === null || isFiniteNumber(payload.rating) ? payload.rating : null,
    userRatingCount: payload.userRatingCount === null || isFiniteNumber(payload.userRatingCount)
      ? payload.userRatingCount
      : null,
    reviewsUrl: isString(payload.reviewsUrl) ? payload.reviewsUrl : "",
    writeReviewUrl: isString(payload.writeReviewUrl) ? payload.writeReviewUrl : "",
    attributions: Array.isArray(payload.attributions)
      ? payload.attributions.filter((item): item is { provider: string; providerUri: string } => (
          Boolean(item)
          && typeof item === "object"
          && isString((item as { provider?: unknown }).provider)
          && isString((item as { providerUri?: unknown }).providerUri)
        ))
      : [],
    reviews: payload.reviews,
  };
};

export async function loadGoogleReviews(signal?: AbortSignal): Promise<GoogleReviewFeed> {
  if (!supabaseUrl) throw new ReviewFeedError("configuration_error");

  const timeoutController = new AbortController();
  const timeout = globalThis.setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => timeoutController.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/google-reviews`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: timeoutController.signal,
    });
    const payload = await response.json().catch(() => ({})) as ReviewFunctionResponse;
    if (!response.ok || payload.ok !== true) {
      throw new ReviewFeedError(payload.code || "unavailable");
    }
    return normalizeFeed(payload);
  } catch (error) {
    if (error instanceof ReviewFeedError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ReviewFeedError(signal?.aborted ? "cancelled" : "timeout");
    }
    throw new ReviewFeedError("network_error");
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
