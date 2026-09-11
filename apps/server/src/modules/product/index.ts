import type { ProductRepository } from '#src/modules/product/database/product.repository.port';
import type { ProductMapper } from '#src/modules/product/product.mapper';

declare global {
  export interface Dependencies {
    productMapper: ProductMapper;
    productRepository: ProductRepository;
  }
}

export { productActionCreator } from '#src/modules/product/product.action-creator';
export { getInventoryStockQuery } from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.handler';
