import { reviewResponseDtoSchema as sharedReviewResponseDtoSchema } from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type { ReviewResponseDto } from '@e-commerce/contracts';
export const reviewResponseDtoSchema = toLegacySchema(sharedReviewResponseDtoSchema, 'output');
