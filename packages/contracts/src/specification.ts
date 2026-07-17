import { type Static, Type } from 'typebox';

// Collection-wide marketing content behind the product page specification tabs (snake_case).
export const SPECIFICATION_ICONS = [
  'recycle-line',
  'paint-line',
  'plant-line',
  'water-flash-line',
  't-shirt-line',
  'hand-heart-line',
  'windy-line',
  'color-filter-line',
  'stack-line',
  'scales-2-line',
  'shield-star-line',
  'price-tag-2-line',
  'rainbow-line',
  'shirt-line',
  'infinity-fill',
  'shapes-line',
] as const;

export const specificationIconDtoSchema = Type.Enum(SPECIFICATION_ICONS);

export const specificationFeatureDtoSchema = Type.Object({
  icon: specificationIconDtoSchema,
  label: Type.String(),
});

export const specificationResponseDtoSchema = Type.Object({
  specification_id: Type.String({ example: 'sustainability' }),
  label: Type.String(),
  title: Type.String(),
  description: Type.String(),
  image_url: Type.String(),
  image_alt: Type.String(),
  features: Type.Array(specificationFeatureDtoSchema),
});

export type SpecificationIconDto = Static<typeof specificationIconDtoSchema>;
export type SpecificationFeatureDto = Static<typeof specificationFeatureDtoSchema>;
export type SpecificationResponseDto = Static<typeof specificationResponseDtoSchema>;
