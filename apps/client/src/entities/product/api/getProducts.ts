import type { ProductListItemDto } from '@e-commerce/contracts';
import { apiGet } from '@/shared/api';
import type { ProductListItem } from '../model/types';

export interface GetProductsOptions {
  limit?: number;
  offset?: number;
}

// The list contract carries no discount percentage; derive it from the price
// pair so shared price helpers (isDiscounted) keep working on card prices.
function toDiscountPercentage(sale: number, list: number): number | null {
  return sale < list ? Math.round((1 - sale / list) * 100) : null;
}

export async function getProducts(
  baseUrl = '',
  { limit, offset }: GetProductsOptions = {},
): Promise<ProductListItem[]> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined) params.set('offset', String(offset));
  const query = params.size > 0 ? `?${params}` : '';

  const data = await apiGet<ProductListItemDto[]>(
    `/v1/products${query}`,
    baseUrl,
  );

  return data.map((item) => ({
    id: item.product_id,
    name: item.name,
    colors: item.colors.map((color) => ({
      color: color.color,
      imageUrl: color.image_url,
      price: {
        sale: color.sale_price,
        list: color.list_price,
        discountPercentage: toDiscountPercentage(
          color.sale_price,
          color.list_price,
        ),
      },
      outOfStock: color.out_of_stock,
    })),
  }));
}
