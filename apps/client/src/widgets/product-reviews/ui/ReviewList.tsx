import { useVirtualizer } from '@tanstack/react-virtual';
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

export const ReviewList = ({
  items,
  total,
  status,
  hasMore,
  perPage,
  activeRating,
  onLoadMore,
  onClearFilter,
  listRef,
}: TReviewListProps) => {
  'use no memo';

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    gap: ROW_GAP,
  });

  let content: ReactNode;
  if (status === 'loading') {
    content = <ReviewSkeleton />;
  } else if (status === 'error') {
    content = (
      <EmptyState
        title="Something went wrong"
        body="We couldn't load the reviews. Please try again."
      />
    );
  } else if (items.length === 0 && activeRating !== null) {
    content = (
      <EmptyState
        title="No matching reviews"
        body={`No ${activeRating}-star reviews yet.`}
        action={<ClearFilterButton className="mt-2" onClick={onClearFilter} />}
      />
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        title="No reviews yet!"
        body="Be the first to review this product"
      />
    );
  } else {
    content = (
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
              disabled={status === 'loadingMore'}
            >
              {status === 'loadingMore'
                ? 'Loading…'
                : `Show ${Math.min(perPage, total - items.length)} more reviews`}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:pt-0 md:pr-8 md:pb-8 md:pl-0"
    >
      {content}
    </div>
  );
};
