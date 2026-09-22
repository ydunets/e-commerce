import * as stylex from '@stylexjs/stylex';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { getReviewSummary } from '@/entities/review';
import { DESKTOP_MEDIA_QUERY } from '@/shared/lib/breakpoints';
import { media } from '@/shared/lib/breakpoints.stylex';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { Dialog } from '@/shared/ui/dialog';
import { animations } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
import { useReviews } from '../lib/useReviews';
import { ReviewList } from './ReviewList';
import { ReviewPhotoPicker } from './ReviewPhotoPicker';
import { ReviewSummary } from './ReviewSummary';

export type TProductReviewsDialogProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
};

const styles = stylex.create({
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    animationName: animations.pulse,
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
    animationIterationCount: 'infinite',
  },
  skeletonBar: { borderRadius: '0.25rem', backgroundColor: colors.surface },
  skeletonTitle: { height: '1.5rem', width: '50%' },
  skeletonBands: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  skeletonBand: { height: '0.75rem', width: '100%' },
  content: {
    display: 'flex',
    minHeight: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: { default: 'column', [media.md]: 'row' },
    gap: { default: null, [media.md]: '2rem' },
    paddingTop: { default: '3.5rem', [media.md]: '72px' },
  },
  summary: {
    flexShrink: 0,
    width: { default: null, [media.md]: '384px' },
    paddingInline: { default: '1.5rem', [media.md]: '2rem' },
    paddingBottom: { default: '1.5rem', [media.md]: '2rem' },
  },
  summaryError: { color: colors.muted },
});

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
  <div {...stylex.props(styles.skeleton)}>
    <div {...stylex.props(styles.skeletonBar, styles.skeletonTitle)} />
    <div {...stylex.props(styles.skeletonBands)}>
      {[0, 1, 2, 3, 4].map((key) => (
        <div
          key={key}
          {...stylex.props(styles.skeletonBar, styles.skeletonBand)}
        />
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
    <div {...stylex.props(styles.content)}>
      <div {...stylex.props(styles.summary)}>
        {summaryQuery.status === 'success' && (
          <ReviewSummary
            summary={summaryQuery.data}
            activeRating={filter}
            onSelectRating={selectRating}
            onClearFilter={clearFilter}
          />
        )}
        {summaryQuery.status === 'error' && (
          <p {...stylex.props(styles.summaryError)}>
            Couldn't load the rating summary.
          </p>
        )}
        {summaryQuery.status === 'pending' && <SummarySkeleton />}
        <ReviewPhotoPicker />
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
