import type { ProductRepository } from '#src/modules/product/database/product.repository.port.ts';
import type { ProductMapper } from '#src/modules/product/product.mapper.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

declare global {
  export interface Dependencies {
    productMapper: ProductMapper;
    productRepository: ProductRepository;
  }
}

export const productActionCreator = actionCreatorFactory('product');
