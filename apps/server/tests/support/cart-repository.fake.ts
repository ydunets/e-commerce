import type { CartRepository } from '#src/modules/cart/database/cart.repository.port';

/** Complete database port fake; unarranged operations fail instead of silently succeeding. */
export function fakeCartRepository(overrides: Partial<CartRepository>): CartRepository {
  async function unexpected(): Promise<never> {
    throw new Error('Unexpected cart repository operation');
  }
  return {
    insert: unexpected,
    findOneById: unexpected,
    upsertLine: unexpected,
    deleteLine: unexpected,
    findCouponByCode: unexpected,
    applyCoupon: unexpected,
    removeCoupon: unexpected,
    applyStockChanges: unexpected,
    ...overrides,
  };
}
