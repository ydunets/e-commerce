import { subscribeResponseDtoSchema as sharedSubscribeResponseDtoSchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type { SubscribeResponseDto } from '@e-commerce/contracts';
export const subscribeResponseDtoSchema = toLegacySchema(
  sharedSubscribeResponseDtoSchema,
  'output',
);
