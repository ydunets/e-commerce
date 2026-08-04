import type { ProductRepository } from '#src/modules/product/database/product.repository.port.ts';
import type { ProductMapper } from '#src/modules/product/product.mapper.ts';

declare global {
  export interface Dependencies {
    productMapper: ProductMapper;
    productRepository: ProductRepository;
  }
}

export { productActionCreator } from '#src/modules/product/product.action-creator.ts';
export { getInventoryStockQuery } from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.handler.ts';
