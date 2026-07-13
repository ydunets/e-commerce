import type { ReviewSummary as ReviewSummaryData } from '@/entities/review';
import { Button } from '@/shared/ui/button';
import { Stars } from '@/shared/ui/stars';
import { ClearFilterButton } from './ClearFilterButton';
import { RatingBands } from './RatingBands';

export type TReviewSummaryProps = {
  summary: ReviewSummaryData;
  activeRating: number | null;
  onSelectRating: (rating: number) => void;
  onClearFilter: () => void;
};

export const ReviewSummary = ({
  summary,
  activeRating,
  onSelectRating,
  onClearFilter,
}: TReviewSummaryProps) => {
  const hasReviews = summary.total > 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-col gap-2">
        <h2 className="text-lg font-semibold text-ink lg:text-xl">
          Overall Rating
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-ink lg:text-lg">
            {hasReviews ? summary.average.toFixed(1) : '0'}
          </span>
          <Stars rating={hasReviews ? summary.average : 0} />
          <span className="text-sm text-muted">
            {hasReviews
              ? `Based on ${summary.total} reviews`
              : 'No reviews yet'}
          </span>
        </div>
      </div>

      <div className="w-full">
        <RatingBands
          distribution={summary.distribution}
          total={summary.total}
          activeRating={activeRating}
          onSelect={onSelectRating}
        />
      </div>

      <div className="flex w-full items-center justify-center gap-6">
        {activeRating !== null && (
          <ClearFilterButton
            onClick={onClearFilter}
            className="flex-1 whitespace-nowrap px-5 py-3"
          />
        )}
        <Button
          variant="secondary"
          size="lg"
          disabled
          className={
            activeRating !== null ? 'flex-1 whitespace-nowrap' : undefined
          }
        >
          Write a review
        </Button>
      </div>
    </div>
  );
};
