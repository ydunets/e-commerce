import type { CartCoupon, CartEntity, StockChange } from '#src/modules/cart/domain/cart.types.ts';

export interface CartRepository {
  insert(cart: CartEntity): Promise<void>;
  findOneById(id: string): Promise<CartEntity | undefined>;
  /** Sets the line to an absolute quantity, creating it when absent. */
  upsertLine(cartId: string, sku: string, quantity: number): Promise<void>;
  /** Returns false when the line did not exist, so the handler can 404. */
  deleteLine(cartId: string, sku: string): Promise<boolean>;
  findCouponByCode(code: string): Promise<CartCoupon | undefined>;
  /** Idempotent: applying an already-applied code is a no-op. */
  applyCoupon(cartId: string, code: string): Promise<void>;
  /** Returns false when the coupon was not applied, so the handler can 404. */
  removeCoupon(cartId: string, code: string): Promise<boolean>;
  /** Applies the clamps and removals of a stock reconciliation in one transaction. */
  applyStockChanges(cartId: string, changes: StockChange[]): Promise<void>;
}
