import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '#src/modules/review/database/review.repository.port';
import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists';
import { paginatedQueryBase } from '#src/shared/ddd/query.base';
import {
  FindProductReviewsQuery,
  type FindProductReviewsResult,
} from './find-product-reviews.query.js';

@QueryHandler(FindProductReviewsQuery)
export class FindProductReviewsHandler implements IQueryHandler<FindProductReviewsQuery> {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly repository: ReviewRepository) {}

  async execute({ payload }: FindProductReviewsQuery): Promise<FindProductReviewsResult> {
    await ensureProductExists(this.repository, payload.productId);
    const query = paginatedQueryBase(payload);
    return this.repository.findAllPaginatedByProduct(payload.productId, query, {
      rating: payload.rating,
    });
  }
}
