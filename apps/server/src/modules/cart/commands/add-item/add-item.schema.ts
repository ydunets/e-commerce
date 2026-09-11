import { addCartItemBodySchema as sharedAddCartItemBodySchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';
export const addCartItemBodySchema = toLegacySchema(sharedAddCartItemBodySchema, 'input');
