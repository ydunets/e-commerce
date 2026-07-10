import { Stars } from '@/shared/ui/stars';
import styles from './StarRating.module.css';

export type TStarRatingProps = {
  rating: number;
  max?: number;
  reviewCount?: number;
  reviewsHref?: string;
  writeReviewHref?: string;
  /** When set, "See all reviews" becomes a button firing this instead of a link. */
  onReviewsClick?: () => void;
};

export const StarRating = ({
  rating,
  max = 5,
  reviewCount,
  reviewsHref = '#',
  writeReviewHref = '#',
  onReviewsClick,
}: TStarRatingProps) => {
  const hasReviews = (reviewCount ?? 0) > 0;

  const seeAllReviews = onReviewsClick ? (
    <button
      type="button"
      onClick={onReviewsClick}
      className={styles.linkButton}
    >
      See all {reviewCount} reviews
    </button>
  ) : (
    <a href={reviewsHref} className={styles.link}>
      See all {reviewCount} reviews
    </a>
  );

  return (
    <div className={styles.root}>
      <span className={styles.value}>
        {hasReviews ? rating.toFixed(1) : '0'}
      </span>

      <Stars
        rating={hasReviews ? rating : 0}
        max={max}
        label={hasReviews ? undefined : 'Not yet rated'}
      />

      {hasReviews ? (
        seeAllReviews
      ) : (
        <span className={styles.empty}>
          No reviews yet.{' '}
          <a href={writeReviewHref} className={styles.link}>
            Be the first.
          </a>
        </span>
      )}
    </div>
  );
};
