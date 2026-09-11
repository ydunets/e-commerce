import {
  inventoryItemDtoSchema as sharedInventoryItemDtoSchema,
  productListItemColorDtoSchema as sharedProductListItemColorDtoSchema,
  productListItemDtoSchema as sharedProductListItemDtoSchema,
  productResponseDtoSchema as sharedProductResponseDtoSchema,
} from '@e-commerce/contracts';
import { toLegacySchema } from '#src/shared/api/legacy-schema';

export type {
  InventoryItemDto,
  ProductListItemColorDto,
  ProductListItemDto,
  ProductResponseDto,
} from '@e-commerce/contracts';
export const inventoryItemDtoSchema = toLegacySchema(sharedInventoryItemDtoSchema, 'output');
export const productListItemColorDtoSchema = toLegacySchema(
  sharedProductListItemColorDtoSchema,
  'output',
);
export const productListItemDtoSchema = toLegacySchema(sharedProductListItemDtoSchema, 'output');
export const productResponseDtoSchema = toLegacySchema(sharedProductResponseDtoSchema, 'output');
