import {
  addCartItemBodySchema as addBody,
  applyCouponBodySchema as couponBody,
  updateCartItemBodySchema as updateBody,
} from '@e-commerce/contracts';
import { z } from 'zod';
import { unwrapQueryValue } from '#src/shared/api/query-value';

export {
  cartCouponParamsSchema,
  cartLineParamsSchema,
  cartParamsSchema,
} from '@e-commerce/contracts';

// Preserve Fastify's former scalar coercions without converting absent values.
function stringValue(value: unknown): unknown {
  const scalar = unwrapQueryValue(value);
  if (scalar === null) return '';
  return typeof scalar === 'number' || typeof scalar === 'boolean' ? String(scalar) : scalar;
}
function quantityValue(value: unknown): unknown {
  const scalar = unwrapQueryValue(value);
  return scalar === null ||
    typeof scalar === 'boolean' ||
    (typeof scalar === 'string' && scalar !== '')
    ? Number(scalar)
    : scalar;
}
export const addCartItemBodySchema = addBody
  .extend({
    cartId: z.preprocess(stringValue, addBody.shape.cartId),
    sku: z.preprocess(stringValue, addBody.shape.sku),
    quantity: z.preprocess(quantityValue, addBody.shape.quantity),
  })
  .meta({ required: ['sku', 'quantity'] });
export const updateCartItemBodySchema = updateBody
  .extend({
    quantity: z.preprocess(quantityValue, updateBody.shape.quantity),
  })
  .meta({ required: ['quantity'] });
export const applyCouponBodySchema = couponBody
  .extend({
    code: z.preprocess(stringValue, couponBody.shape.code),
  })
  .meta({ required: ['code'] });
