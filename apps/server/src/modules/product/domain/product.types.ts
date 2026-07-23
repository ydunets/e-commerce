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

// Per-colour summary shown on a product card: the card price is the lowest
// sale price among the colour's sizes, with that size's list price.
export interface ProductColorVariant {
  color: string;
  imageUrl: string | null;
  salePrice: number;
  listPrice: number;
  outOfStock: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  colors: ProductColorVariant[];
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
