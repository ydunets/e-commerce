import {
  cartLineParamsSchema as sharedCartLineParamsSchema,
  updateCartItemBodySchema as sharedUpdateCartItemBodySchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const cartLineParamsSchema = toLegacySchema(sharedCartLineParamsSchema, 'input');
export const updateCartItemBodySchema = toLegacySchema(sharedUpdateCartItemBodySchema, 'input');
