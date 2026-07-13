import type { ProductEntity } from '#src/modules/product/domain/product.types.ts';

export interface ProductRepository {
  findOneById(id: string): Promise<Omit<ProductEntity, 'reviews'> | undefined>;
}
