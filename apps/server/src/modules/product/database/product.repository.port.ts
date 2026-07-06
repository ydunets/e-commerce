import type { ProductEntity } from '#src/modules/product/domain/product.types.ts';

export interface ProductRepository {
  findOneById(id: string): Promise<ProductEntity | undefined>;
}
