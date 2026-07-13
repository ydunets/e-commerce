import { expect, rstest, test } from '@rstest/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import type { Review, ReviewsPage } from '@/entities/review';
import { DESKTOP_MEDIA_QUERY } from '@/shared/lib/breakpoints';

const TOTAL = 30;

const makeReview = (id: number): Review => ({
  id,
  userId: `user-${id}`,
  name: `Reviewer ${id}`,
  avatarUrl: null,
  rating: 5,
  content: 'Great hoodie.',
  createdAt: '2026-01-15',
});

rstest.mock('@/entities/review', () => ({
  getProductReviews: async (
    _productId: string,
    { page = 0, perPage = 12 }: { page?: number; perPage?: number } = {},
  ): Promise<ReviewsPage> => ({
    count: TOTAL,
    limit: perPage,
    page,
    items: Array.from({ length: perPage }, (_, index) =>
      makeReview(page * perPage + index + 1),
    ),
  }),
  getReviewSummary: async () => ({
    total: TOTAL,
    average: 5,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: TOTAL },
  }),
}));

rstest.mock('@/shared/ui/dialog', () => ({
  Dialog: ({ open, children }: PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
}));

const stubMatchMedia = (desktopMatches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: query === DESKTOP_MEDIA_QUERY && desktopMatches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as typeof window.matchMedia;
};

const renderDialog = async () => {
  const { ProductReviewsDialog } = await import(
    '@/widgets/product-reviews/ui/ProductReviewsDialog.tsx'
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProductReviewsDialog
        open
        onClose={() => {}}
        productId="voyager-hoodie"
        productName="Voyager Hoodie"
      />
    </QueryClientProvider>,
  );
};

test('below the desktop boundary the page size is 10', async () => {
  stubMatchMedia(false);
  await renderDialog();

  expect(
    await screen.findByRole('button', { name: 'Show 10 more reviews' }),
  ).toBeInTheDocument();
});

test('at the desktop boundary the page size is 12', async () => {
  stubMatchMedia(true);
  await renderDialog();

  expect(
    await screen.findByRole('button', { name: 'Show 12 more reviews' }),
  ).toBeInTheDocument();
});
