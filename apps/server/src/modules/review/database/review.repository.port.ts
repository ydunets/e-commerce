import type { ReviewEntity, ReviewSummary } from '#src/modules/review/domain/review.types.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

export interface ReviewFilters {
  /** Optional star rating (1..5) to filter the list by. */
  rating?: number;
}

export interface ReviewRepository {
  /** Whether a product with this id exists (used to 404 unknown products). */
  productExists(productId: string): Promise<boolean>;

  /** Reviews for a product, newest first, paginated and optionally filtered by rating.
   *  `count` reflects the filtered total so "show more" math stays correct. */
  findAllPaginatedByProduct(
    productId: string,
    params: PaginatedQueryParams,
    filters: ReviewFilters,
  ): Promise<Paginated<ReviewEntity>>;

  /** Filter-independent rating summary: total, average and per-band distribution. */
  getSummary(productId: string): Promise<ReviewSummary>;
}
