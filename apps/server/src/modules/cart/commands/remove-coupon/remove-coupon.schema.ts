import { cartCouponParamsSchema as sharedCartCouponParamsSchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const cartCouponParamsSchema = toLegacySchema(sharedCartCouponParamsSchema, 'input');
