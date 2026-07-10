import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import type { ReactNode, RefObject } from 'react';
import type { Review } from '@/entities/review';
import { Button } from '@/shared/ui/button';
import type { ReviewsStatus } from '../lib/useReviews';
import { ClearFilterButton } from './ClearFilterButton';
import { ReviewItem } from './ReviewItem';

export type TReviewListProps = {
  items: Review[];
  total: number;
  status: ReviewsStatus;
  hasMore: boolean;
  perPage: number;
  activeRating: number | null;
  onLoadMore: () => void;
  onClearFilter: () => void;
  listRef: RefObject<HTMLDivElement | null>;
};

const ESTIMATED_ROW_HEIGHT = 112;
const ROW_GAP = 32;

const EmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
    <p className="text-lg font-semibold text-ink">{title}</p>
    <p className="text-muted">{body}</p>
    {action}
  </div>
);

const ReviewSkeleton = () => (
  <div className="flex flex-col gap-6">
    {[0, 1, 2, 3].map((key) => (
      <div key={key} className="flex animate-pulse gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-surface" />
          <div className="h-3 w-1/4 rounded bg-surface" />
          <div className="h-3 w-full rounded bg-surface" />
        </div>
      </div>
    ))}
  </div>
);

const ReviewsLoadError = () => (
  <EmptyState
    title="Something went wrong"
    body="We couldn't load the reviews. Please try again."
  />
);

const NoMatchingReviews = ({
  activeRating,
  onClearFilter,
}: {
  activeRating: number;
  onClearFilter: () => void;
}) => (
  <EmptyState
    title="No matching reviews"
    body={`No ${activeRating}-star reviews yet.`}
    action={<ClearFilterButton className="mt-2" onClick={onClearFilter} />}
  />
);

const NoReviewsYet = () => (
  <EmptyState
    title="No reviews yet!"
    body="Be the first to review this product"
  />
);

type TVirtualizedReviewsProps = {
  items: Review[];
  total: number;
  status: ReviewsStatus;
  hasMore: boolean;
  perPage: number;
  onLoadMore: () => void;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
};

const VirtualizedReviews = ({
  items,
  total,
  status,
  hasMore,
  perPage,
  onLoadMore,
  virtualizer,
}: TVirtualizedReviewsProps) => {
  const loadingMore = status === 'loadingMore';
  const remainingCount = Math.min(perPage, total - items.length);

  return (
    <>
      <ul
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <li
            key={items[virtualItem.index].id}
            ref={virtualizer.measureElement}
            data-index={virtualItem.index}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            <ReviewItem review={items[virtualItem.index]} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="pt-8">
          <Button
            variant="secondary"
            className="w-full"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : `Show ${remainingCount} more reviews`}
          </Button>
        </div>
      )}
    </>
  );
};

const ReviewListContent = (
  props: TReviewListProps & {
    virtualizer: Virtualizer<HTMLDivElement, Element>;
  },
) => {
  const { items, status, activeRating, onClearFilter } = props;

  if (status === 'loading') return <ReviewSkeleton />;
  if (status === 'error') return <ReviewsLoadError />;
  if (items.length === 0 && activeRating !== null) {
    return (
      <NoMatchingReviews
        activeRating={activeRating}
        onClearFilter={onClearFilter}
      />
    );
  }
  if (items.length === 0) return <NoReviewsYet />;
  return <VirtualizedReviews {...props} />;
};

export const ReviewList = (props: TReviewListProps) => {
  'use no memo';

  const virtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => props.listRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    gap: ROW_GAP,
  });

  return (
    <div
      ref={props.listRef}
      className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:pt-0 md:pr-8 md:pb-8 md:pl-0"
    >
      <ReviewListContent {...props} virtualizer={virtualizer} />
    </div>
  );
};
