import * as stylex from '@stylexjs/stylex';
import type { ReviewSummary as ReviewSummaryData } from '@/entities/review';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { Stars } from '@/shared/ui/stars';
import { colors } from '@/shared/ui/tokens.stylex';
import { ClearFilterButton } from './ClearFilterButton';
import { RatingBands } from './RatingBands';

export type TReviewSummaryProps = {
  summary: ReviewSummaryData;
  activeRating: number | null;
  onSelectRating: (rating: number) => void;
  onClearFilter: () => void;
};

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  title: {
    fontSize: { default: '1.125rem', [media.lg]: '1.25rem' },
    lineHeight: '1.75rem',
    fontWeight: 600,
    color: colors.ink,
  },
  rating: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  average: {
    fontSize: { default: '1rem', [media.lg]: '1.125rem' },
    lineHeight: { default: '1.5rem', [media.lg]: '1.75rem' },
    fontWeight: 600,
    color: colors.ink,
  },
  count: { fontSize: '0.875rem', lineHeight: '1.25rem', color: colors.muted },
  bands: { width: '100%' },
  actions: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
  },
  action: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    whiteSpace: 'nowrap',
  },
  clearFilter: { paddingInline: '1.25rem', paddingBlock: '0.75rem' },
});

export const ReviewSummary = ({
  summary,
  activeRating,
  onSelectRating,
  onClearFilter,
}: TReviewSummaryProps) => {
  const hasReviews = summary.total > 0;

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.header)}>
        <h2 {...stylex.props(styles.title)}>Overall Rating</h2>
        <div {...stylex.props(styles.rating)}>
          <span {...stylex.props(styles.average)}>
            {hasReviews ? summary.average.toFixed(1) : '0'}
          </span>
          <Stars rating={hasReviews ? summary.average : 0} />
          <span {...stylex.props(styles.count)}>
            {hasReviews
              ? `Based on ${summary.total} reviews`
              : 'No reviews yet'}
          </span>
        </div>
      </div>

      <div {...stylex.props(styles.bands)}>
        <RatingBands
          distribution={summary.distribution}
          total={summary.total}
          activeRating={activeRating}
          onSelect={onSelectRating}
        />
      </div>

      <div {...stylex.props(styles.actions)}>
        {activeRating !== null && (
          <ClearFilterButton
            onClick={onClearFilter}
            style={[styles.action, styles.clearFilter]}
          />
        )}
        <Button
          variant="secondary"
          size="lg"
          disabled
          style={activeRating !== null && styles.action}
        >
          Write a review
        </Button>
      </div>
    </div>
  );
};
