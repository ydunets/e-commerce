import type { Price } from '@/shared/lib/price';

export interface ProductVariant {
  sku: string;
  color: string;
  /** Clothing sizes are strings ('xs'); shoe sizes numbers-as-strings ('4.5'); one-size is null. */
  size: string | null;
  price: Price;
  stock: number;
  sold: number;
}

export interface ProductImage {
  color: string;
  url: string;
}

export interface ProductInfoSection {
  title: string;
  description: string[];
}

export interface ProductReviewSummary {
  count: number;
  average: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Colours in display order (first is the default selection). */
  colors: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  info: ProductInfoSection[];
  reviews: ProductReviewSummary;
}
