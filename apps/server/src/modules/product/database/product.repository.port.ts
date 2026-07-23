import type { ProductEntity, ProductListItem } from '#src/modules/product/domain/product.types.ts';

export interface FindManyProductsOptions {
  limit?: number;
  offset?: number;
}

export interface ProductRepository {
  findOneById(id: string): Promise<Omit<ProductEntity, 'reviews'> | undefined>;
  findMany(options: FindManyProductsOptions): Promise<ProductListItem[]>;
}
