import { z } from 'zod';

function unwrapQueryValue(value: unknown): unknown {
  return Array.isArray(value) && value.length === 1 ? value[0] : value;
}

function numericQueryValue(value: unknown): unknown {
  const scalar = unwrapQueryValue(value);
  return typeof scalar === 'string' && scalar !== '' ? Number(scalar) : scalar;
}

const MAX_PRODUCT_LIMIT = 100;
export const listProductsQuerystringSchema = z.object({
  limit: z.preprocess(numericQueryValue, z.number().int().min(1).max(MAX_PRODUCT_LIMIT).optional()),
  offset: z.preprocess(numericQueryValue, z.number().int().min(0).optional()),
  collection: z.preprocess(unwrapQueryValue, z.string().optional()),
  exclude: z.preprocess(unwrapQueryValue, z.string().optional()),
});
export type ListProductsQuerystring = z.infer<typeof listProductsQuerystringSchema>;
