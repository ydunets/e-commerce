import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  REVIEW_REPOSITORY,
  type ReviewRepository,
} from '#src/modules/review/database/review.repository.port';
import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists';
import { GetReviewSummaryQuery, type GetReviewSummaryResult } from './get-review-summary.query.js';

@QueryHandler(GetReviewSummaryQuery)
export class GetReviewSummaryHandler implements IQueryHandler<GetReviewSummaryQuery> {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly repository: ReviewRepository) {}

  async execute({ payload }: GetReviewSummaryQuery): Promise<GetReviewSummaryResult> {
    await ensureProductExists(this.repository, payload.productId);
    return this.repository.getSummary(payload.productId);
  }
}
