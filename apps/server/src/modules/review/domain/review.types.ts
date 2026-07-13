export interface ReviewAuthor {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewEntity {
  id: number;
  productId: string;
  author: ReviewAuthor;
  rating: number; // 1..5
  content: string | null;
  createdAt: Date;
}

export type RatingValue = 1 | 2 | 3 | 4 | 5;

/** Count of reviews per star rating; every band is present (0 when none). */
export type RatingDistribution = Record<RatingValue, number>;

export interface ReviewSummary {
  total: number;
  average: number;
  distribution: RatingDistribution;
}
