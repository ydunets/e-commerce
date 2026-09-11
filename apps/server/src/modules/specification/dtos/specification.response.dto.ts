import {
  specificationFeatureDtoSchema as sharedSpecificationFeatureDtoSchema,
  specificationIconDtoSchema as sharedSpecificationIconDtoSchema,
  specificationResponseDtoSchema as sharedSpecificationResponseDtoSchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type {
  SpecificationFeatureDto,
  SpecificationIconDto,
  SpecificationResponseDto,
} from '@e-commerce/contracts';
export const specificationFeatureDtoSchema = toLegacySchema(
  sharedSpecificationFeatureDtoSchema,
  'output',
);
export const specificationIconDtoSchema = toLegacySchema(
  sharedSpecificationIconDtoSchema,
  'output',
);
export const specificationResponseDtoSchema = toLegacySchema(
  sharedSpecificationResponseDtoSchema,
  'output',
);
