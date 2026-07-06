export interface ProductVariant {
  sku: string;
  color: string;
  size: string | null; // null for one-size products (hats, socks, sunglasses)
  listPrice: number;
  salePrice: number;
  discountPercentage: number | null;
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

export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  colors: string[]; // display order; first colour is the default selection
  sizes: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  info: ProductInfoSection[];
  reviews: ProductReviewSummary;
}
