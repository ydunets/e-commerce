import { z } from 'zod';

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

export const specificationIconDtoSchema = z.enum(SPECIFICATION_ICONS);

export const specificationFeatureDtoSchema = z.object({
  icon: specificationIconDtoSchema,
  label: z.string(),
});

export const specificationResponseDtoSchema = z.object({
  specification_id: z.string().meta({ example: 'sustainability' }),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  image_url: z.string(),
  image_alt: z.string(),
  features: z.array(specificationFeatureDtoSchema),
});

export type SpecificationIconDto = z.infer<typeof specificationIconDtoSchema>;
export type SpecificationFeatureDto = z.infer<typeof specificationFeatureDtoSchema>;
export type SpecificationResponseDto = z.infer<typeof specificationResponseDtoSchema>;
