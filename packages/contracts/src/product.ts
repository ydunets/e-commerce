import { z } from 'zod';

// Mirrors the GreatFrontend e-commerce product API shape (snake_case).
export const inventoryItemDtoSchema = z.object({
  sku: z.string(),
  color: z.string(),
  size: z.union([z.string(), z.null()]),
  list_price: z.number(),
  discount_percentage: z.union([z.number(), z.null()]),
  sale_price: z.number(),
  sold: z.int(),
  stock: z.int(),
});

const imageSchema = z.object({
  color: z.string(),
  image_url: z.string(),
});

const infoSchema = z.object({
  title: z.string(),
  description: z.array(z.string()),
});

const priceRangeSchema = z.object({
  highest: z.number(),
  lowest: z.number(),
});

export const productResponseDtoSchema = z.object({
  product_id: z.string().meta({ example: 'voyager-hoodie' }),
  name: z.string(),
  description: z.string(),
  collection: z.string().meta({ example: 'urban' }),
  colors: z.array(z.string()),
  sizes: z.array(z.string()),
  images: z.array(imageSchema),
  info: z.array(infoSchema),
  inventory: z.array(inventoryItemDtoSchema),
  priceRange: priceRangeSchema,
  rating: z.number(),
  reviews: z.int(),
});

export const productListItemColorDtoSchema = z.object({
  color: z.string(),
  image_url: z.union([z.string(), z.null()]),
  sale_price: z.number(),
  list_price: z.number(),
  out_of_stock: z.boolean(),
});

export const productListItemDtoSchema = z.object({
  product_id: z.string().meta({ example: 'voyager-hoodie' }),
  name: z.string(),
  colors: z.array(productListItemColorDtoSchema),
});

export type InventoryItemDto = z.infer<typeof inventoryItemDtoSchema>;
export type ProductResponseDto = z.infer<typeof productResponseDtoSchema>;
export type ProductListItemColorDto = z.infer<typeof productListItemColorDtoSchema>;
export type ProductListItemDto = z.infer<typeof productListItemDtoSchema>;
