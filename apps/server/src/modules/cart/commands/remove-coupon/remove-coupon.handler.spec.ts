import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartRepository } from '#src/modules/cart/database/cart.repository.port';
import type { CartCoupon, CartEntity } from '#src/modules/cart/domain/cart.types';
import { NotFoundException } from '#src/shared/exceptions/index';
import { fakeCartRepository } from '#tests/support/cart-repository.fake';
import { RemoveCouponCommand } from './remove-coupon.command.js';
import { RemoveCouponHandler } from './remove-coupon.handler.js';

const WELCOME: CartCoupon = { code: 'WELCOME15', discountType: 'percentage', value: 15 };
const SAVE: CartCoupon = { code: 'SAVE20', discountType: 'fixed', value: 20 };

function fakeDeps(options: { cart?: CartEntity; removed?: boolean }): {
  cartRepository: CartRepository;
} {
  return {
    cartRepository: fakeCartRepository({
      findOneById: async (id: string) => (options.cart?.id === id ? options.cart : undefined),
      removeCoupon: async () => options.removed ?? false,
    }),
  };
}

describe('removeCouponCommand handler', () => {
  it('removes the coupon and keeps the others', async () => {
    const deps = fakeDeps({
      cart: { id: 'cart-1', createdAt: new Date(), lines: [], coupons: [WELCOME, SAVE] },
      removed: true,
    });

    const cart = await new RemoveCouponHandler(deps.cartRepository).execute(
      new RemoveCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
    );

    assert.deepEqual(cart.coupons, [SAVE]);
  });

  it('rejects a coupon that is not applied with not found', async () => {
    const deps = fakeDeps({
      cart: { id: 'cart-1', createdAt: new Date(), lines: [], coupons: [] },
      removed: false,
    });

    await assert.rejects(
      () =>
        new RemoveCouponHandler(deps.cartRepository).execute(
          new RemoveCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
        ),
      NotFoundException,
    );
  });

  it('rejects an unknown cart with not found', async () => {
    const deps = fakeDeps({});

    await assert.rejects(
      () =>
        new RemoveCouponHandler(deps.cartRepository).execute(
          new RemoveCouponCommand({ cartId: 'missing', code: 'WELCOME15' }),
        ),
      NotFoundException,
    );
  });
});
