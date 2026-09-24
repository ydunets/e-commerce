import * as stylex from '@stylexjs/stylex';
import { media } from '@/shared/lib/breakpoints.stylex';
import { focusRing } from '@/shared/ui/focus-ring';
import { Stars } from '@/shared/ui/stars';
import { colors } from '@/shared/ui/tokens.stylex';

export type TStarRatingProps = {
  rating: number;
  max?: number;
  reviewCount?: number;
  reviewsHref?: string;
  writeReviewHref?: string;
  /** When set, "See all reviews" becomes a button firing this instead of a link. */
  onReviewsClick?: () => void;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    lineHeight: 1,
  },
  value: {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    fontWeight: 400,
    color: colors.ink,
  },
  link: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
    color: colors.brand,
    textDecorationLine: {
      default: 'none',
      ':hover': { default: null, [media.hover]: 'underline' },
    },
    borderRadius: { default: null, ':focus-visible': '0.25rem' },
  },
  linkButton: {
    cursor: 'pointer',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },
  empty: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.muted },
});

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
      {...stylex.props(styles.link, styles.linkButton, focusRing.ring)}
    >
      See all {reviewCount} reviews
    </button>
  ) : (
    <a href={reviewsHref} {...stylex.props(styles.link, focusRing.ring)}>
      See all {reviewCount} reviews
    </a>
  );

  return (
    <div {...stylex.props(styles.root)}>
      <span {...stylex.props(styles.value)}>
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
        <span {...stylex.props(styles.empty)}>
          No reviews yet.{' '}
          <a
            href={writeReviewHref}
            {...stylex.props(styles.link, focusRing.ring)}
          >
            Be the first.
          </a>
        </span>
      )}
    </div>
  );
};
