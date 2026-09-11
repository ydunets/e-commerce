import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetReviewSummaryQuery,
  type GetReviewSummaryResult,
  getReviewSummaryQuery,
} from '#src/modules/review/queries/get-review-summary/get-review-summary.query';
import type { QueryBus } from '#src/shared/cqrs/bus.types';

// The review port replaces this adapter with its real Nest handler.
@QueryHandler(GetReviewSummaryQuery)
export class LegacyReviewSummaryHandler implements IQueryHandler<GetReviewSummaryQuery> {
  private legacy?: Pick<QueryBus, 'execute'>;

  connect(legacy: Pick<QueryBus, 'execute'>): void {
    this.legacy = legacy;
  }

  async execute(query: GetReviewSummaryQuery): Promise<GetReviewSummaryResult> {
    if (!this.legacy) throw new Error('Legacy review query bus is not connected');
    return this.legacy.execute(getReviewSummaryQuery(query.payload, query.meta));
  }
}
