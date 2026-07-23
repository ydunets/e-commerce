import type { ProductListItemDto } from '@e-commerce/contracts';
import { apiGet } from './client';

/** Liveness probe for the About page: any successful API round-trip will do. */
export function fetchCatalog(): Promise<ProductListItemDto[]> {
  return apiGet<ProductListItemDto[]>('/v1/products');
}
