import { useEffect, useState } from "react";
import { ExternalLink, MessageSquareText, Star, UserRound } from "lucide-react";
import { trackLinkClick } from "../analytics";
import {
  loadGoogleReviews,
  reviewProfileLinks,
  type GoogleReview,
  type GoogleReviewFeed,
} from "../reviews";
import type { PageSection } from "../content/types";
import { Blocks } from "./Blocks";

const googleProfileUrl = reviewProfileLinks.find((source) => source.key === "google")!.href;
const MINIMUM_DISPLAY_RATING = 4;
const OUT_OF_SCOPE_REVIEW_TERMS = /\b(?:mortgage|lender|loan|financing)\b/i;

function isDisplayableReview(review: GoogleReview): boolean {
  return review.rating >= MINIMUM_DISPLAY_RATING
    && !OUT_OF_SCOPE_REVIEW_TERMS.test(review.text);
}

function ExternalReviewLink({
  className = "",
  href,
  label,
  source,
}: {
  className?: string;
  href: string;
  label: string;
  source: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackLinkClick(href, label, source)}
    >
      <span>{label}</span>
      <ExternalLink size={18} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}

function ReviewSourceLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`review-source-grid ${compact ? "is-compact" : ""}`}>
      {reviewProfileLinks.map((source) => (
        <ExternalReviewLink
          key={source.key}
          className="review-source-link"
          href={source.href}
          label={source.label}
          source="review_source"
        />
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const boundedRating = Math.max(0, Math.min(5, rating));
  const filledStars = Math.round(boundedRating);

  return (
    <span className="review-stars" role="img" aria-label={`${boundedRating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={18}
          strokeWidth={1.8}
          className={index < filledStars ? "is-filled" : ""}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewAuthor({ review }: { review: GoogleReview }) {
  const avatar = review.author.photoUri ? (
    <img
      src={review.author.photoUri}
      alt={`${review.author.displayName || "Google Maps reviewer"} profile photo`}
      width="44"
      height="44"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="review-author-fallback" aria-hidden="true">
      <UserRound size={22} strokeWidth={1.7} />
    </span>
  );
  const details = (
    <>
      {avatar}
      <span>
        <strong>{review.author.displayName || "Google Maps reviewer"}</strong>
        {review.relativePublishTimeDescription && <small>{review.relativePublishTimeDescription}</small>}
      </span>
    </>
  );

  if (!review.author.uri) return <div className="review-author">{details}</div>;

  return (
    <a
      className="review-author"
      href={review.author.uri}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackLinkClick(review.author.uri, "Google review author", "google_review")}
    >
      {details}
    </a>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="google-review-card">
      <ReviewAuthor review={review} />
      <StarRating rating={review.rating} />
      {review.text && <p className="google-review-text">{review.text}</p>}
      {review.translated && (
        <p className="google-review-translation">Translated by Google Maps. The original is available at the source.</p>
      )}
      <ExternalReviewLink
        className="google-review-source"
        href={review.googleMapsUri}
        label="View on Google Maps"
        source="google_review"
      />
    </article>
  );
}

function GoogleReviewsLoading() {
  return (
    <div className="google-reviews-loading" role="status" aria-live="polite">
      <p>Loading Google reviews...</p>
      <div className="google-review-grid" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="google-review-skeleton" key={index} />
        ))}
      </div>
    </div>
  );
}

function GoogleReviewsFallback() {
  return (
    <div className="google-reviews-fallback">
      <MessageSquareText size={28} strokeWidth={1.6} aria-hidden="true" />
      <div>
        <h3>Read the reviews on Google</h3>
        <p>Open the Google Business profile for the latest ratings and review activity.</p>
        <ExternalReviewLink
          className="button button-small"
          href={googleProfileUrl}
          label="Open Google Reviews"
          source="review_fallback"
        />
      </div>
    </div>
  );
}

function GoogleReviewsPanel() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; feed: GoogleReviewFeed }
    | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    loadGoogleReviews(controller.signal).then(
      (feed) => setState({ status: "success", feed }),
      (error) => {
        if (controller.signal.aborted) return;
        setState({ status: "error" });
        if (import.meta.env.DEV) console.info("Google reviews are using the public-profile fallback.", error);
      },
    );
    return () => controller.abort();
  }, []);

  if (state.status === "loading") return <GoogleReviewsLoading />;
  if (state.status === "error") return <GoogleReviewsFallback />;

  const { feed } = state;
  const reviewsUrl = feed.reviewsUrl || googleProfileUrl;
  const displayedReviews = feed.reviews.filter(isDisplayableReview);

  return (
    <div className="google-reviews-content">
      <div className="google-reviews-summary">
        <div>
          <p className="google-maps-attribution" translate="no">Google Maps</p>
          <h2>Google reviews</h2>
          {feed.rating !== null && (
            <div className="google-rating-line">
              <strong>{feed.rating.toFixed(1)}</strong>
              <StarRating rating={feed.rating} />
              {feed.userRatingCount !== null && <span>{feed.userRatingCount.toLocaleString()} reviews</span>}
            </div>
          )}
        </div>
        <ExternalReviewLink
          className="button button-small"
          href={reviewsUrl}
          label="See All on Google"
          source="google_review_summary"
        />
      </div>

      <p className="google-review-ordering">
        Google Maps orders the returned reviews by relevance. This page displays returned reviews rated 4 or 5 stars that fit this site's real estate scope; read all reviews on Google Maps.
      </p>

      {displayedReviews.length ? (
        <div className="google-review-grid">
          {displayedReviews.map((review) => <GoogleReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        <div className="google-reviews-fallback">
          <MessageSquareText size={28} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <h3>Read all Google reviews</h3>
            <p>Open the Google Business profile for the complete set of current ratings and reviews.</p>
            <ExternalReviewLink
              className="button button-small"
              href={reviewsUrl}
              label="Open Google Reviews"
              source="review_empty"
            />
          </div>
        </div>
      )}

      {feed.attributions.length > 0 && (
        <p className="google-provider-attributions">
          Additional data providers:{" "}
          {feed.attributions.map((attribution, index) => (
            <span key={`${attribution.provider}-${index}`}>
              {index > 0 ? ", " : ""}
              {attribution.providerUri ? (
                <a href={attribution.providerUri} target="_blank" rel="noreferrer">{attribution.provider}</a>
              ) : attribution.provider}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function AboutReviewsSection({
  section,
  navigate,
}: {
  section: PageSection;
  navigate: (path: string) => void;
}) {
  return (
    <section className="section about-reviews-section">
      <div className="about-reviews-intro">
        <Blocks blocks={section.blocks} navigate={navigate} headingLevel="compact" />
      </div>
      <div className="google-reviews-section" aria-label="Google reviews">
        <GoogleReviewsPanel />
      </div>
      <div className="about-review-sources">
        <h3>More review profiles</h3>
        <ReviewSourceLinks compact />
      </div>
    </section>
  );
}
