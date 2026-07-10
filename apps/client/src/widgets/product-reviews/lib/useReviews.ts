import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getProductReviews, type Review } from '@/entities/review';

export type ReviewsStatus = 'loading' | 'loadingMore' | 'success' | 'error';

export interface UseReviewsResult {
  items: Review[];
  total: number;
  status: ReviewsStatus;
  filter: number | null;
  hasMore: boolean;
  setFilter: (rating: number | null) => void;
  loadMore: () => void;
}

export function useReviews(
  productId: string,
  perPage: number,
): UseReviewsResult {
  const [filter, setFilter] = useState<number | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['reviews', productId, perPage, filter],
    queryFn: ({ pageParam }) =>
      getProductReviews(productId, {
        page: pageParam,
        perPage,
        rating: filter,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      (lastPage.page + 1) * lastPage.limit < lastPage.count
        ? lastPage.page + 1
        : undefined,
  });

  const status: ReviewsStatus = query.isError
    ? 'error'
    : query.isPending
      ? 'loading'
      : query.isFetchingNextPage
        ? 'loadingMore'
        : 'success';

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  };

  const pages = query.data?.pages ?? [];

  return {
    items: pages.flatMap((page) => page.items),
    total: pages[pages.length - 1]?.count ?? 0,
    status,
    filter,
    hasMore: query.hasNextPage,
    setFilter,
    loadMore,
  };
}
