export type PublicGoogleReview = {
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

export type PublicGoogleReviewFeed = {
  rating: number | null;
  userRatingCount: number | null;
  reviewsUrl: string;
  writeReviewUrl: string;
  attributions: Array<{ provider: string; providerUri: string }>;
  reviews: PublicGoogleReview[];
};

const objectValue = (value: unknown): Record<string, unknown> => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const httpsUrl = (value: unknown): string => {
  const text = stringValue(value).trim();
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
};

const ratingValue = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) && value >= 0 &&
    value <= 5
    ? value
    : null
);

const countValue = (value: unknown): number | null => (
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null
);

export function normalizePlacesResponse(
  value: unknown,
): PublicGoogleReviewFeed {
  const place = objectValue(value);
  const links = objectValue(place.googleMapsLinks);
  const reviews = Array.isArray(place.reviews) ? place.reviews : [];
  const attributions = Array.isArray(place.attributions)
    ? place.attributions
    : [];

  return {
    rating: ratingValue(place.rating),
    userRatingCount: countValue(place.userRatingCount),
    reviewsUrl: httpsUrl(links.reviewsUri),
    writeReviewUrl: httpsUrl(links.writeAReviewUri),
    attributions: attributions.flatMap((candidate) => {
      const attribution = objectValue(candidate);
      const provider = stringValue(attribution.provider).trim();
      if (!provider) return [];
      return [{ provider, providerUri: httpsUrl(attribution.providerUri) }];
    }),
    reviews: reviews.flatMap((candidate) => {
      const review = objectValue(candidate);
      const googleMapsUri = httpsUrl(review.googleMapsUri);
      if (!googleMapsUri) return [];

      const text = objectValue(review.text);
      const originalText = objectValue(review.originalText);
      const author = objectValue(review.authorAttribution);
      const reviewText = stringValue(text.text);
      const originalReviewText = stringValue(originalText.text);
      const languageCode = stringValue(text.languageCode);
      const originalLanguageCode = stringValue(originalText.languageCode);
      const id = stringValue(review.name).trim() || googleMapsUri;

      return [{
        id,
        rating: ratingValue(review.rating) ?? 0,
        text: reviewText,
        relativePublishTimeDescription: stringValue(
          review.relativePublishTimeDescription,
        ),
        publishTime: stringValue(review.publishTime),
        translated: Boolean(originalReviewText) && (
          originalReviewText !== reviewText ||
          Boolean(
            originalLanguageCode && languageCode &&
              originalLanguageCode !== languageCode,
          )
        ),
        author: {
          displayName: stringValue(author.displayName).trim(),
          uri: httpsUrl(author.uri),
          photoUri: httpsUrl(author.photoUri),
        },
        googleMapsUri,
        flagContentUri: httpsUrl(review.flagContentUri),
      }];
    }),
  };
}
