import { cartLineParamsSchema as sharedCartLineParamsSchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const cartLineParamsSchema = toLegacySchema(sharedCartLineParamsSchema, 'input');
