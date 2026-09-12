import type { ReviewsPageResponseDto } from '@e-commerce/contracts';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { FindProductReviewsQuery } from './queries/find-product-reviews/find-product-reviews.query.js';
import {
  type FindProductReviewsQuerystring,
  findProductReviewsParamsSchema,
  findProductReviewsQuerySchema,
} from './queries/find-product-reviews/find-product-reviews.schema.js';
import { GetReviewSummaryQuery } from './queries/get-review-summary/get-review-summary.query.js';
import {
  getReviewSummaryParamsSchema,
  type ReviewParams,
} from './queries/get-review-summary/get-review-summary.schema.js';
import { toReviewResponse } from './review.mapper.js';

@Controller('api/v1/products/:productId/reviews')
export class ReviewController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Get()
  @RouteSchema({
    description: 'Find reviews for a product (paginated, optionally filtered by rating)',
    tags: ['reviews'],
  })
  async list(
    @Param({ schema: findProductReviewsParamsSchema }) params: ReviewParams,
    @Query({ schema: findProductReviewsQuerySchema }) query: FindProductReviewsQuerystring,
  ): Promise<ReviewsPageResponseDto> {
    const result = await this.dispatcher.query(
      new FindProductReviewsQuery({ ...query, productId: params.productId }),
    );
    return { ...result, data: result.data.map(toReviewResponse) };
  }

  @Get('summary')
  @RouteSchema({
    description: 'Get the rating summary (average + distribution) for a product',
    tags: ['reviews'],
  })
  summary(@Param({ schema: getReviewSummaryParamsSchema }) params: ReviewParams) {
    return this.dispatcher.query(new GetReviewSummaryQuery(params));
  }
}
