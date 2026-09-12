import { z } from 'zod';
import { paginatedQueryRequestProperties } from '#src/shared/api/paginated-query.request.dto';
import { numericQueryValue } from '#src/shared/api/query-value';

export { getReviewSummaryParamsSchema as findProductReviewsParamsSchema } from '../get-review-summary/get-review-summary.schema.js';

const MIN_RATING = 1;
const MAX_RATING = 5;

// Like the legacy validator, the object schema strips unknown query keys.
export const findProductReviewsQuerySchema = z.object({
  ...paginatedQueryRequestProperties,
  rating: z.preprocess(
    numericQueryValue,
    z.int().min(MIN_RATING).max(MAX_RATING).optional().meta({
      example: 5,
      description: 'Filter reviews by star rating',
    }),
  ),
});

export type FindProductReviewsQuerystring = z.infer<typeof findProductReviewsQuerySchema>;
