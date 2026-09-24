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

  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of RATING_VALUES) {
    distribution[rating] = data.distribution[rating] ?? 0;
  }

  return { total: data.total, average: data.average, distribution };
}
