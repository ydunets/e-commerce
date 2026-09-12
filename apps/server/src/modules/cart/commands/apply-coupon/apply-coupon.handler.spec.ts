import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartRepository } from '#src/modules/cart/database/cart.repository.port';
import type { CartCoupon, CartEntity } from '#src/modules/cart/domain/cart.types';
import { NotFoundException } from '#src/shared/exceptions/index';
import { fakeCartRepository } from '#tests/support/cart-repository.fake';
import { ApplyCouponCommand } from './apply-coupon.command.js';
import { ApplyCouponHandler } from './apply-coupon.handler.js';

const WELCOME: CartCoupon = { code: 'WELCOME15', discountType: 'percentage', value: 15 };

function cartWith(coupons: CartCoupon[]): CartEntity {
  return { id: 'cart-1', createdAt: new Date(), lines: [], coupons };
}

function fakeDeps(options: { cart?: CartEntity; coupon?: CartCoupon }): {
  deps: { cartRepository: CartRepository };
  applied: { cartId: string; code: string }[];
} {
  const applied: { cartId: string; code: string }[] = [];
  const deps: { cartRepository: CartRepository } = {
    cartRepository: fakeCartRepository({
      findOneById: async (id: string) => (options.cart?.id === id ? options.cart : undefined),
      findCouponByCode: async (code: string) =>
        options.coupon?.code === code ? options.coupon : undefined,
      applyCoupon: async (cartId: string, code: string) => void applied.push({ cartId, code }),
    }),
  };
  return { deps, applied };
}

describe('applyCouponCommand handler', () => {
  it('applies an existing coupon and appends it to the cart', async () => {
    const { deps, applied } = fakeDeps({ cart: cartWith([]), coupon: WELCOME });

    const cart = await new ApplyCouponHandler(deps.cartRepository).execute(
      new ApplyCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
    );

    assert.deepEqual(applied, [{ cartId: 'cart-1', code: 'WELCOME15' }]);
    assert.deepEqual(cart.coupons, [WELCOME]);
  });

  it('keeps a single entry when the coupon is already applied', async () => {
    const { deps } = fakeDeps({ cart: cartWith([WELCOME]), coupon: WELCOME });

    const cart = await new ApplyCouponHandler(deps.cartRepository).execute(
      new ApplyCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
    );

    assert.deepEqual(cart.coupons, [WELCOME]);
  });

  it('rejects an unknown coupon with not found before writing', async () => {
    const { deps, applied } = fakeDeps({ cart: cartWith([]) });

    await assert.rejects(
      () =>
        new ApplyCouponHandler(deps.cartRepository).execute(
          new ApplyCouponCommand({ cartId: 'cart-1', code: 'NO-SUCH-CODE' }),
        ),
      NotFoundException,
    );
    assert.equal(applied.length, 0);
  });

  it('rejects an unknown cart with not found', async () => {
    const { deps } = fakeDeps({ coupon: WELCOME });

    await assert.rejects(
      () =>
        new ApplyCouponHandler(deps.cartRepository).execute(
          new ApplyCouponCommand({ cartId: 'missing', code: 'WELCOME15' }),
        ),
      NotFoundException,
    );
  });
});
