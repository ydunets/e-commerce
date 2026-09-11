import type { ReviewRepository } from '#src/modules/review/database/review.repository.port';
import type { ReviewMapper } from '#src/modules/review/review.mapper';

declare global {
  export interface Dependencies {
    reviewMapper: ReviewMapper;
    reviewRepository: ReviewRepository;
  }
}

export { getReviewSummaryQuery } from '#src/modules/review/queries/get-review-summary/get-review-summary.query';
export { reviewActionCreator } from '#src/modules/review/review.action-creator';
