import { type Static, Type } from 'typebox';

// Mirrors the GreatFrontend e-commerce product API shape (snake_case).
export const inventoryItemDtoSchema = Type.Object({
  sku: Type.String(),
  color: Type.String(),
  size: Type.Union([Type.String(), Type.Null()]),
  list_price: Type.Number(),
  discount_percentage: Type.Union([Type.Number(), Type.Null()]),
  sale_price: Type.Number(),
  sold: Type.Integer(),
  stock: Type.Integer(),
});

const imageSchema = Type.Object({
  color: Type.String(),
  image_url: Type.String(),
});

const infoSchema = Type.Object({
  title: Type.String(),
  description: Type.Array(Type.String()),
});

const priceRangeSchema = Type.Object({
  highest: Type.Number(),
  lowest: Type.Number(),
});

export const productResponseDtoSchema = Type.Object({
  product_id: Type.String({ example: 'voyager-hoodie' }),
  name: Type.String(),
  description: Type.String(),
  colors: Type.Array(Type.String()),
  sizes: Type.Array(Type.String()),
  images: Type.Array(imageSchema),
  info: Type.Array(infoSchema),
  inventory: Type.Array(inventoryItemDtoSchema),
  priceRange: priceRangeSchema,
  rating: Type.Number(),
  reviews: Type.Integer(),
});

export type InventoryItemDto = Static<typeof inventoryItemDtoSchema>;
export type ProductResponseDto = Static<typeof productResponseDtoSchema>;
