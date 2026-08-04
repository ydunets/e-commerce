import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';

export interface CartRepository {
  insert(cart: CartEntity): Promise<void>;
  findOneById(id: string): Promise<CartEntity | undefined>;
  /** Sets the line to an absolute quantity, creating it when absent. */
  upsertLine(cartId: string, sku: string, quantity: number): Promise<void>;
  /** Returns false when the line did not exist, so the handler can 404. */
  deleteLine(cartId: string, sku: string): Promise<boolean>;
}
