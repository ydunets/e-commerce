import { ensureProductExists } from '#src/modules/review/queries/ensure-product-exists';
import type { HandlerAction } from '#src/shared/cqrs/bus.types';

import { type GetReviewSummaryResult, getReviewSummaryQuery } from './get-review-summary.query.js';

export { getReviewSummaryQuery } from './get-review-summary.query.js';

export default function makeGetReviewSummaryQuery({ queryBus, reviewRepository }: Dependencies) {
  return {
    async handler({
      payload,
    }: HandlerAction<typeof getReviewSummaryQuery>): Promise<GetReviewSummaryResult> {
      await ensureProductExists(reviewRepository, payload.productId);
      return reviewRepository.getSummary(payload.productId);
    },
    init() {
      queryBus.register(getReviewSummaryQuery.type, this.handler);
    },
  };
}
