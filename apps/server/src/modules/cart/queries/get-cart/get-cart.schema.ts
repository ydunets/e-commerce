import { cartParamsSchema as sharedCartParamsSchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const cartParamsSchema = toLegacySchema(sharedCartParamsSchema, 'input');
