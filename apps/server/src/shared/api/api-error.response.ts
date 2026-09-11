import {
  apiErrorResponseSchema as sharedApiErrorResponseSchema,
  apiErrorSubErrorSchema as sharedApiErrorSubErrorSchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type { ApiErrorResponse, ApiErrorSubError } from '@e-commerce/contracts';
export const apiErrorResponseSchema = toLegacySchema(sharedApiErrorResponseSchema, 'output');
export const apiErrorSubErrorSchema = toLegacySchema(sharedApiErrorSubErrorSchema, 'output');
