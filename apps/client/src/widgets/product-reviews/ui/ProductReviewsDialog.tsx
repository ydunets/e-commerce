import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { getReviewSummary } from '@/entities/review';
import { DESKTOP_MEDIA_QUERY } from '@/shared/lib/breakpoints';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { Dialog } from '@/shared/ui/dialog';
import { useReviews } from '../lib/useReviews';
import { ReviewList } from './ReviewList';
import { ReviewSummary } from './ReviewSummary';

export type TProductReviewsDialogProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
};

export const ProductReviewsDialog = ({
  open,
  onClose,
  productId,
  productName,
}: TProductReviewsDialogProps) => (
  <Dialog open={open} onClose={onClose} label={`Reviews for ${productName}`}>
    {open && <ReviewsContent productId={productId} />}
  </Dialog>
);

const SummarySkeleton = () => (
  <div className="flex animate-pulse flex-col gap-6">
    <div className="h-6 w-1/2 rounded bg-surface" />
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3, 4].map((key) => (
        <div key={key} className="h-3 w-full rounded bg-surface" />
      ))}
    </div>
  </div>
);

const ReviewsContent = ({ productId }: { productId: string }) => {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const perPage = isDesktop ? 12 : 10;

  const { items, total, status, hasMore, filter, setFilter, loadMore } =
    useReviews(productId, perPage);

  const summaryQuery = useQuery({
    queryKey: ['review-summary', productId],
    queryFn: () => getReviewSummary(productId),
  });

  const listRef = useRef<HTMLDivElement>(null);
  const changeFilter = (rating: number | null) => {
    setFilter(rating);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const selectRating = (rating: number) =>
    changeFilter(filter === rating ? null : rating);
  const clearFilter = () => changeFilter(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-14 md:flex-row md:gap-8 md:pt-[72px]">
      <div className="shrink-0 px-6 pb-6 md:w-[384px] md:px-8 md:pb-8">
        {summaryQuery.status === 'success' && (
          <ReviewSummary
            summary={summaryQuery.data}
            activeRating={filter}
            onSelectRating={selectRating}
            onClearFilter={clearFilter}
          />
        )}
        {summaryQuery.status === 'error' && (
          <p className="text-muted">Couldn't load the rating summary.</p>
        )}
        {summaryQuery.status === 'pending' && <SummarySkeleton />}
      </div>

      <ReviewList
        items={items}
        total={total}
        status={status}
        hasMore={hasMore}
        perPage={perPage}
        activeRating={filter}
        onLoadMore={loadMore}
        onClearFilter={clearFilter}
        listRef={listRef}
      />
    </div>
  );
};
