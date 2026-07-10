import { expect, rstest, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { Review } from '@/entities/review';
import {
  ReviewList,
  type TReviewListProps,
} from '@/widgets/product-reviews/ui/ReviewList.tsx';

const PER_PAGE = 12;
const TOTAL = 10;
const REMAINING = TOTAL - 2;
const RATING_FILTER = 2;
const CLEAR_FILTER = { name: 'Clear filter' } as const;
const VIEWPORT_SIZE = 800;

for (const dimension of ['offsetWidth', 'offsetHeight'] as const) {
  Object.defineProperty(HTMLElement.prototype, dimension, {
    configurable: true,
    get: () => VIEWPORT_SIZE,
  });
}

const makeReview = (overrides: Partial<Review>): Review => ({
  id: 1,
  userId: 'user-1',
  name: 'Ada Lovelace',
  avatarUrl: null,
  rating: 5,
  content: 'Great hoodie.',
  createdAt: '2026-01-15',
  ...overrides,
});

const makeProps = (overrides: Partial<TReviewListProps>): TReviewListProps => ({
  items: [],
  total: 0,
  status: 'success',
  hasMore: false,
  perPage: PER_PAGE,
  activeRating: null,
  onLoadMore: () => {},
  onClearFilter: () => {},
  listRef: createRef<HTMLDivElement>(),
  ...overrides,
});

const twoReviews = [
  makeReview({ id: 1, name: 'Ada Lovelace' }),
  makeReview({ id: 2, name: 'Grace Hopper' }),
];

test('loading renders the skeleton and no list', () => {
  const { container } = render(
    <ReviewList {...makeProps({ status: 'loading' })} />,
  );

  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
    0,
  );
});

test('error renders the failure message', () => {
  render(<ReviewList {...makeProps({ status: 'error' })} />);

  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(
    screen.getByText("We couldn't load the reviews. Please try again."),
  ).toBeInTheDocument();
});

test('no matches under a rating filter offers to clear it', async () => {
  const user = userEvent.setup();
  const onClearFilter = rstest.fn();
  render(
    <ReviewList
      {...makeProps({ activeRating: RATING_FILTER, onClearFilter })}
    />,
  );

  expect(screen.getByText('No matching reviews')).toBeInTheDocument();
  expect(
    screen.getByText(`No ${RATING_FILTER}-star reviews yet.`),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', CLEAR_FILTER));
  expect(onClearFilter).toHaveBeenCalledTimes(1);
});

test('no reviews at all renders the first-review invitation', () => {
  render(<ReviewList {...makeProps({})} />);

  expect(screen.getByText('No reviews yet!')).toBeInTheDocument();
  expect(
    screen.getByText('Be the first to review this product'),
  ).toBeInTheDocument();
});

test('reviews render as a list with a load-more count', async () => {
  const user = userEvent.setup();
  const onLoadMore = rstest.fn();
  render(
    <ReviewList
      {...makeProps({
        items: twoReviews,
        total: TOTAL,
        hasMore: true,
        onLoadMore,
      })}
    />,
  );

  expect(screen.getByRole('list')).toBeInTheDocument();
  expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  expect(screen.getByText('Grace Hopper')).toBeInTheDocument();

  const loadMore = screen.getByRole('button', {
    name: `Show ${REMAINING} more reviews`,
  });
  await user.click(loadMore);
  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

test('loading more disables the button and swaps its label', () => {
  render(
    <ReviewList
      {...makeProps({
        items: twoReviews,
        total: TOTAL,
        hasMore: true,
        status: 'loadingMore',
      })}
    />,
  );

  expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
});

test('the load-more button disappears on the last page', () => {
  render(<ReviewList {...makeProps({ items: twoReviews, total: TOTAL })} />);

  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
