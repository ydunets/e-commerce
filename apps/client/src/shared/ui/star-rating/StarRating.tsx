import { type KeyboardEvent, type SVGProps, useRef } from 'react';
import { Stars } from '@/shared/ui/stars';
import styles from './StarRating.module.css';

const Star = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

export type TStarRatingProps = {
  rating: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label?: string;
  name?: string;
  reviewCount?: number;
  reviewsHref?: string;
  writeReviewHref?: string;
  /** When set, "See all reviews" becomes a button firing this instead of a link. */
  onReviewsClick?: () => void;
};

export const StarRating = ({
  rating,
  max = 5,
  onChange,
  readOnly = false,
  label,
  name,
  reviewCount,
  reviewsHref = '#',
  writeReviewHref = '#',
  onReviewsClick,
}: TStarRatingProps) => {
  const stars = Array.from({ length: max }, (_, index) => index + 1);

  if (onChange) {
    return (
      <InteractiveStars
        stars={stars}
        rating={rating}
        max={max}
        onChange={onChange}
        readOnly={readOnly}
        label={label ?? 'Rating'}
        name={name}
      />
    );
  }

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

type TInteractiveStarsProps = {
  stars: number[];
  rating: number;
  max: number;
  onChange: (value: number) => void;
  readOnly: boolean;
  label: string;
  name?: string;
};

const InteractiveStars = ({
  stars,
  rating,
  max,
  onChange,
  readOnly,
  label,
  name,
}: TInteractiveStarsProps) => {
  const selected = Math.round(rating);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectValue = (value: number) => {
    const clamped = Math.min(max, Math.max(1, value));
    onChange(clamped);
    buttonsRef.current[clamped - 1]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        selectValue(selected + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        selectValue((selected || 1) - 1);
        break;
      case 'Home':
        event.preventDefault();
        selectValue(1);
        break;
      case 'End':
        event.preventDefault();
        selectValue(max);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={styles.input}
      role="radiogroup"
      aria-label={label}
      aria-readonly={readOnly || undefined}
      onKeyDown={handleKeyDown}
    >
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      {stars.map((starValue, index) => (
        // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA radiogroup composite with roving tabindex; native radios cannot be styled as these controls.
        <button
          key={starValue}
          ref={(node) => {
            buttonsRef.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={selected === starValue}
          aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
          data-active={rating >= starValue}
          disabled={readOnly}
          tabIndex={
            selected === starValue || (selected === 0 && index === 0) ? 0 : -1
          }
          className={styles.starButton}
          onClick={() => onChange(starValue)}
        >
          <Star className={styles.star} />
        </button>
      ))}
    </div>
  );
};
