import { Type } from 'typebox';
import { reviewResponseDtoSchema } from '#src/modules/review/dtos/review.response.dto';
import { paginatedResponseBaseSchema } from '#src/shared/api/paginated.response.base';

export const reviewPaginatedResponseSchema = Type.Intersect([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(reviewResponseDtoSchema),
  }),
]);
