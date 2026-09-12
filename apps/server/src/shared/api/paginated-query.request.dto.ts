import { z } from 'zod';
import { numericQueryValue } from '#src/shared/api/query-value';

const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 99_999;

export const paginatedQueryRequestProperties = {
  limit: z.preprocess(
    numericQueryValue,
    z.number().min(1).max(MAX_PAGE_SIZE).optional().meta({
      example: 10,
      description: 'Specifies a limit of returned records',
    }),
  ),
  page: z.preprocess(
    numericQueryValue,
    z.number().min(0).max(MAX_PAGE).optional().meta({
      example: 0,
      description: 'Page number',
    }),
  ),
};
