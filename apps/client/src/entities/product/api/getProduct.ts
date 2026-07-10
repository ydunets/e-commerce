import type { ProductResponseDto } from '@e-commerce/contracts';
import { apiGet } from '@/shared/api';
import type { Product } from '../model/types';

export async function getProduct(
  productId: string,
  baseUrl = '',
): Promise<Product> {
  const data = await apiGet<ProductResponseDto>(
    `/v1/products/${productId}`,
    baseUrl,
  );

  return {
    id: data.product_id,
    name: data.name,
    description: data.description,
    colors: data.colors,
    variants: data.inventory.map((item) => ({
      sku: item.sku,
      color: item.color,
      size: item.size,
      price: {
        sale: item.sale_price,
        list: item.list_price,
        discountPercentage: item.discount_percentage,
      },
      stock: item.stock,
      sold: item.sold,
    })),
    images: data.images.map((image) => ({
      color: image.color,
      url: image.image_url,
    })),
    info: data.info,
    reviews: { count: data.reviews, average: data.rating },
  };
}
