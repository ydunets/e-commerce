import {
  applyCouponBodySchema as sharedApplyCouponBodySchema,
  cartParamsSchema as sharedCartParamsSchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const applyCouponBodySchema = toLegacySchema(sharedApplyCouponBodySchema, 'input');
export const cartParamsSchema = toLegacySchema(sharedCartParamsSchema, 'input');
