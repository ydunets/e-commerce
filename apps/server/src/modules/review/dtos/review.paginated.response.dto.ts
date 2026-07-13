import { Type } from 'typebox';
import { reviewResponseDtoSchema } from '#src/modules/review/dtos/review.response.dto.ts';
import { paginatedResponseBaseSchema } from '#src/shared/api/paginated.response.base.ts';

export const reviewPaginatedResponseSchema = Type.Intersect([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(reviewResponseDtoSchema),
  }),
]);
