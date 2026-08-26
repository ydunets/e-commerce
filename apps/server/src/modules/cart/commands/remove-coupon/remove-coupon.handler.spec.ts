import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartCoupon, CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';
import makeRemoveCoupon, { removeCouponCommand } from './remove-coupon.handler.ts';

const WELCOME: CartCoupon = { code: 'WELCOME15', discountType: 'percentage', value: 15 };
const SAVE: CartCoupon = { code: 'SAVE20', discountType: 'fixed', value: 20 };

function fakeDeps(options: { cart?: CartEntity; removed?: boolean }): Dependencies {
  return {
    cartRepository: {
      findOneById: async (id: string) => (options.cart?.id === id ? options.cart : undefined),
      removeCoupon: async () => options.removed ?? false,
    },
  } as never as Dependencies;
}

describe('removeCouponCommand handler', () => {
  it('removes the coupon and keeps the others', async () => {
    const deps = fakeDeps({
      cart: { id: 'cart-1', createdAt: new Date(), lines: [], coupons: [WELCOME, SAVE] },
      removed: true,
    });

    const cart = await makeRemoveCoupon(deps).handler(
      removeCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
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
        makeRemoveCoupon(deps).handler(
          removeCouponCommand({ cartId: 'cart-1', code: 'WELCOME15' }),
        ),
      NotFoundException,
    );
  });

  it('rejects an unknown cart with not found', async () => {
    const deps = fakeDeps({});

    await assert.rejects(
      () =>
        makeRemoveCoupon(deps).handler(
          removeCouponCommand({ cartId: 'missing', code: 'WELCOME15' }),
        ),
      NotFoundException,
    );
  });

  it('registers itself on the command bus under its action type', () => {
    const registered: string[] = [];

    makeRemoveCoupon({
      ...fakeDeps({}),
      commandBus: { register: (type: string) => void registered.push(type) },
    } as never).init();

    assert.deepEqual(registered, [removeCouponCommand.type]);
  });
});
