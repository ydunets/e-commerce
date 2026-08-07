import type { ProductResponseDto } from '@e-commerce/contracts';
import { apiGet, isApiError } from '@/shared/api';
import type { Product } from '../model/types';

function toProduct(data: ProductResponseDto): Product {
  return {
    id: data.product_id,
    name: data.name,
    description: data.description,
    collection: data.collection,
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

// The catalog answers 404 for an id it does not carry, which is an answer
// rather than a failure. Every other status stays an error.
export async function findProduct(
  productId: string,
  baseUrl = '',
): Promise<Product | null> {
  try {
    const data = await apiGet<ProductResponseDto>(
      `/v1/products/${productId}`,
      baseUrl,
    );
    return toProduct(data);
  } catch (error) {
    if (isApiError(error) && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
