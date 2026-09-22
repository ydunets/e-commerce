import * as stylex from '@stylexjs/stylex';
import {
  useVirtualizer,
  type VirtualItem,
  type Virtualizer,
} from '@tanstack/react-virtual';
import type { ReactNode, RefObject } from 'react';
import type { Review } from '@/entities/review';
import { media } from '@/shared/lib/breakpoints.stylex';
import { Button } from '@/shared/ui/button';
import { animations } from '@/shared/ui/motion.stylex';
import { colors } from '@/shared/ui/tokens.stylex';
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

const styles = stylex.create({
  root: {
    minHeight: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    overflowY: 'auto',
    paddingTop: { default: '1.5rem', [media.md]: 0 },
    paddingRight: { default: '1.5rem', [media.md]: '2rem' },
    paddingBottom: { default: '1.5rem', [media.md]: '2rem' },
    paddingLeft: { default: '1.5rem', [media.md]: 0 },
  },
  emptyState: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    paddingBlock: '4rem',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: { default: '1rem', [media.lg]: '1.125rem' },
    lineHeight: { default: '1.5rem', [media.lg]: '1.75rem' },
    fontWeight: 600,
    color: colors.ink,
  },
  emptyBody: {
    fontSize: { default: '0.875rem', [media.lg]: '1rem' },
    lineHeight: { default: '1.25rem', [media.lg]: '1.5rem' },
    color: colors.muted,
  },
  emptyAction: { marginTop: '0.5rem' },
  skeleton: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  skeletonRow: {
    display: 'flex',
    gap: '0.75rem',
    animationName: animations.pulse,
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
    animationIterationCount: 'infinite',
  },
  skeletonAvatar: {
    height: '2.5rem',
    width: '2.5rem',
    flexShrink: 0,
    borderRadius: '9999px',
    backgroundColor: colors.surface,
  },
  skeletonBody: {
    display: 'flex',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  skeletonBar: {
    height: '0.75rem',
    borderRadius: '0.25rem',
    backgroundColor: colors.surface,
  },
  skeletonName: { height: '1rem', width: '33.333333%' },
  skeletonMeta: { width: '25%' },
  skeletonText: { width: '100%' },
  list: { position: 'relative', width: '100%' },
  row: { position: 'absolute', top: 0, left: 0, width: '100%' },
  loadMore: { paddingTop: '2rem' },
  fullWidth: { width: '100%' },
});

const EmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) => (
  <div {...stylex.props(styles.emptyState)}>
    <p {...stylex.props(styles.emptyTitle)}>{title}</p>
    <p {...stylex.props(styles.emptyBody)}>{body}</p>
    {action}
  </div>
);

const ReviewSkeleton = () => (
  <div {...stylex.props(styles.skeleton)} aria-busy="true">
    {[0, 1, 2, 3].map((key) => (
      <div key={key} {...stylex.props(styles.skeletonRow)}>
        <div {...stylex.props(styles.skeletonAvatar)} />
        <div {...stylex.props(styles.skeletonBody)}>
          <div {...stylex.props(styles.skeletonBar, styles.skeletonName)} />
          <div {...stylex.props(styles.skeletonBar, styles.skeletonMeta)} />
          <div {...stylex.props(styles.skeletonBar, styles.skeletonText)} />
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
    action={
      <ClearFilterButton style={styles.emptyAction} onClick={onClearFilter} />
    }
  />
);

const NoReviewsYet = () => (
  <EmptyState
    title="No reviews yet!"
    body="Be the first to review this product"
  />
);

// The virtualizer instance is mutable and referentially stable, so compiled
// (memoized) components must receive its state as plain data; reading it here
// would go stale between scroll updates.
type TVirtualListState = {
  virtualItems: VirtualItem[];
  totalSize: number;
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement'];
};

type TVirtualizedReviewsProps = {
  items: Review[];
  total: number;
  status: ReviewsStatus;
  hasMore: boolean;
  perPage: number;
  onLoadMore: () => void;
} & TVirtualListState;

const VirtualizedReviews = ({
  items,
  total,
  status,
  hasMore,
  perPage,
  onLoadMore,
  virtualItems,
  totalSize,
  measureElement,
}: TVirtualizedReviewsProps) => {
  const loadingMore = status === 'loadingMore';
  const remainingCount = Math.min(perPage, total - items.length);

  return (
    <>
      <ul {...stylex.props(styles.list)} style={{ height: totalSize }}>
        {virtualItems.map((virtualItem) => (
          <li
            key={items[virtualItem.index].id}
            ref={measureElement}
            data-index={virtualItem.index}
            {...stylex.props(styles.row)}
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            <ReviewItem review={items[virtualItem.index]} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div {...stylex.props(styles.loadMore)}>
          <Button
            variant="secondary"
            style={styles.fullWidth}
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

const ReviewListContent = (props: TReviewListProps & TVirtualListState) => {
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

  // oxlint-disable-next-line react/incompatible-library -- the directive above opts this component out of the compiler, which is the fix the rule asks for.
  const virtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => props.listRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    gap: ROW_GAP,
  });

  return (
    <div ref={props.listRef} {...stylex.props(styles.root)}>
      <ReviewListContent
        {...props}
        virtualItems={virtualizer.getVirtualItems()}
        totalSize={virtualizer.getTotalSize()}
        measureElement={virtualizer.measureElement}
      />
    </div>
  );
};
