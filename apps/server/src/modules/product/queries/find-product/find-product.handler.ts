import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '#src/modules/product/database/product.repository.port';
import type { ProductEntity } from '#src/modules/product/domain/product.types';
import {
  GetReviewSummaryQuery,
  type GetReviewSummaryResult,
} from '#src/modules/review/queries/get-review-summary/get-review-summary.query';
import { NotFoundException } from '#src/shared/exceptions/index';
import { FindProductQuery } from './find-product.query.js';

@QueryHandler(FindProductQuery)
export class FindProductHandler implements IQueryHandler<FindProductQuery> {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(QueryBus)
    private readonly queries: {
      execute(query: GetReviewSummaryQuery): Promise<GetReviewSummaryResult>;
    },
  ) {}

  async execute(query: FindProductQuery): Promise<ProductEntity> {
    const [product, summary] = await Promise.all([
      this.repository.findOneById(query.payload.id),
      // Legacy middleware owns this bridged query until review migrates.
      this.queries.execute(new GetReviewSummaryQuery({ productId: query.payload.id })),
    ]);
    if (!product) throw new NotFoundException(`Product ${query.payload.id} not found`);
    return { ...product, reviews: { count: summary.total, average: summary.average } };
  }
}
