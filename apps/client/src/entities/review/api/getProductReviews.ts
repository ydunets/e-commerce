import { apiGet } from '@/shared/api';
import type { Review, ReviewsPage } from '../model/types';

// The GreatFrontend e-commerce reviews shape the server mirrors (snake_case).
interface GfeReview {
  id: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  content: string | null;
  created_at: string;
}

interface GfeReviewsResponse {
  count: number;
  limit: number;
  page: number;
  data: GfeReview[];
}

export interface GetProductReviewsParams {
  page?: number;
  perPage?: number;
  rating?: number | null;
}

const toReview = (review: GfeReview): Review => ({
  id: review.id,
  userId: review.user_id,
  name: review.name,
  avatarUrl: review.avatar_url,
  rating: review.rating,
  content: review.content,
  createdAt: review.created_at,
});

export async function getProductReviews(
  productId: string,
  { page = 0, perPage = 12, rating = null }: GetProductReviewsParams = {},
  baseUrl = '',
): Promise<ReviewsPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(perPage),
  });
  if (rating != null) params.set('rating', String(rating));

  const data = await apiGet<GfeReviewsResponse>(
    `/v1/products/${productId}/reviews?${params.toString()}`,
    baseUrl,
  );

  return {
    count: data.count,
    limit: data.limit,
    page: data.page,
    items: data.data.map(toReview),
  };
}
