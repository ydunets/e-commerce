import { z } from 'zod';

export const findProductParamsSchema = z.object({
  id: z.string().describe('Product identifier (slug)'),
});
export type FindProductParams = z.infer<typeof findProductParamsSchema>;
