export interface CartLine {
  sku: string;
  quantity: number;
}

// Product data is joined from inventory at read time, never snapshotted
// (ADR 0002); the write model remains sku + quantity.
export interface EnrichedCartLine extends CartLine {
  productId: string;
  name: string;
  color: string;
  size: string | null;
  imageUrl: string | null;
  listPrice: number;
  discountPercentage: number | null;
  salePrice: number;
  stock: number;
}

export type CartDiscountType = 'percentage' | 'fixed';

export interface CartCoupon {
  code: string;
  discountType: CartDiscountType;
  value: number;
}

export interface CartEntity {
  id: string;
  createdAt: Date;
  lines: EnrichedCartLine[];
  coupons: CartCoupon[];
}

export interface StockChange {
  sku: string;
  name: string;
  previousQuantity: number;
  quantity: number;
  stock: number;
}
