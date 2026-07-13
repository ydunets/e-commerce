import type { ReviewRepository } from '#src/modules/review/database/review.repository.port.ts';
import type { ReviewMapper } from '#src/modules/review/review.mapper.ts';

declare global {
  export interface Dependencies {
    reviewMapper: ReviewMapper;
    reviewRepository: ReviewRepository;
  }
}

export { getReviewSummaryQuery } from '#src/modules/review/queries/get-review-summary/get-review-summary.handler.ts';
export { reviewActionCreator } from '#src/modules/review/review.action-creator.ts';
