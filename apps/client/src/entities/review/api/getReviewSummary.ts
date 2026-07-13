import { apiGet } from '@/shared/api';
import {
  RATING_VALUES,
  type RatingDistribution,
  type ReviewSummary,
} from '../model/types';

interface GfeSummaryResponse {
  total: number;
  average: number;
  distribution: Record<string, number>;
}

export async function getReviewSummary(
  productId: string,
  baseUrl = '',
): Promise<ReviewSummary> {
  const data = await apiGet<GfeSummaryResponse>(
    `/v1/products/${productId}/reviews/summary`,
    baseUrl,
  );

  const distribution = Object.fromEntries(
    RATING_VALUES.map((rating) => [rating, data.distribution[rating] ?? 0]),
  ) as RatingDistribution;

  return { total: data.total, average: data.average, distribution };
}
