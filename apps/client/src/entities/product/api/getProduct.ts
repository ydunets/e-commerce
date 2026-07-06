import { apiGet } from '@/shared/api';
import type { Product } from '../model/types';

// The GreatFrontend e-commerce product shape the server mirrors.
interface GfeInventoryItem {
  sku: string;
  color: string;
  size: string | number | null;
  list_price: number;
  discount_percentage: number | null;
  sale_price: number;
  stock: number;
  sold: number;
}

interface GfeProduct {
  product_id: string;
  name: string;
  description: string;
  colors: string[];
  images: { color: string; image_url: string }[];
  info: { title: string; description: string[] }[];
  inventory: GfeInventoryItem[];
  rating: number;
  reviews: number;
}

const toSize = (size: string | number | null): string | null =>
  size === null ? null : String(size);

export async function getProduct(
  productId: string,
  baseUrl = '',
): Promise<Product> {
  const data = await apiGet<GfeProduct>(`/v1/products/${productId}`, baseUrl);

  return {
    id: data.product_id,
    name: data.name,
    description: data.description,
    colors: data.colors,
    variants: data.inventory.map((item) => ({
      sku: item.sku,
      color: item.color,
      size: toSize(item.size),
      listPrice: item.list_price,
      salePrice: item.sale_price,
      discountPercentage: item.discount_percentage,
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
