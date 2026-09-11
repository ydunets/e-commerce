import {
  cartResponseDtoSchema as sharedCartResponseDtoSchema,
  validateCartResponseDtoSchema as sharedValidateCartResponseDtoSchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type { CartResponseDto, ValidateCartResponseDto } from '@e-commerce/contracts';
export const cartResponseDtoSchema = toLegacySchema(sharedCartResponseDtoSchema, 'output');
export const validateCartResponseDtoSchema = toLegacySchema(
  sharedValidateCartResponseDtoSchema,
  'output',
);
