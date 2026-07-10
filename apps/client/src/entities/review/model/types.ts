/** Every legal star rating, lowest first. The single source for iteration. */
export const RATING_VALUES = [1, 2, 3, 4, 5] as const;

export type RatingValue = (typeof RATING_VALUES)[number];

export interface Review {
  id: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  content: string | null;
  /** ISO date string, 'YYYY-MM-DD'. */
  createdAt: string;
}

export interface ReviewsPage {
  count: number;
  limit: number;
  page: number;
  items: Review[];
}

/** Count of reviews per star rating; every band is present (0 when none). */
export type RatingDistribution = Record<RatingValue, number>;

export interface ReviewSummary {
  total: number;
  average: number;
  distribution: RatingDistribution;
}
