import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartCoupon, CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';
import makeApplyCoupon, { applyCouponCommand } from './apply-coupon.handler.ts';

const WELCOME: CartCoupon = { code: 'WELCOME15', discountType: 'percentage', value: 15 };

function cartWith(coupons: CartCoupon[]): CartEntity {
  return { id: 'cart-1', createdAt: new Date(), lines: [], coupons };
}

function fakeDeps(options: { cart?: CartEntity; coupon?: CartCoupon }): {
  deps: Dependencies;
  applied: { cartId: string; code: string }[];
} {
  const applied: { cartId: string; code: string }[] = [];
  const deps = {
    cartRepository: {
      findOneById: async (id: string) => (options.cart?.id === id ? options.cart : undefined),
      findCouponByCode: async (code: string) =>
        options.coupon?.code === code ? options.coupon : undefined,
      applyCoupon: async (cartId: string, code: string) => void applied.push({ cartId, code }),
    },
  } as never as Dependencies;
  return { deps, applied };
}

describe('applyCouponCommand handler', () => {
  it('applies an existing coupon and appends it to the cart', async () => {
    const { deps, applied } = fakeDeps({ cart: cartWith([]), coupon: WELCOME });

    const cart = await makeApplyCoupon(deps).handler({
      payload: { cartId: 'cart-1', code: 'WELCOME15' },
    } as never);

    assert.deepEqual(applied, [{ cartId: 'cart-1', code: 'WELCOME15' }]);
    assert.deepEqual(cart.coupons, [WELCOME]);
  });

  it('keeps a single entry when the coupon is already applied', async () => {
    const { deps } = fakeDeps({ cart: cartWith([WELCOME]), coupon: WELCOME });

    const cart = await makeApplyCoupon(deps).handler({
      payload: { cartId: 'cart-1', code: 'WELCOME15' },
    } as never);

    assert.deepEqual(cart.coupons, [WELCOME]);
  });

  it('rejects an unknown coupon with not found before writing', async () => {
    const { deps, applied } = fakeDeps({ cart: cartWith([]) });

    await assert.rejects(
      () =>
        makeApplyCoupon(deps).handler({
          payload: { cartId: 'cart-1', code: 'NO-SUCH-CODE' },
        } as never),
      NotFoundException,
    );
    assert.equal(applied.length, 0);
  });

  it('rejects an unknown cart with not found', async () => {
    const { deps } = fakeDeps({ coupon: WELCOME });

    await assert.rejects(
      () =>
        makeApplyCoupon(deps).handler({
          payload: { cartId: 'missing', code: 'WELCOME15' },
        } as never),
      NotFoundException,
    );
  });

  it('registers itself on the command bus under its action type', () => {
    const registered: string[] = [];
    const { deps } = fakeDeps({});

    makeApplyCoupon({
      ...deps,
      commandBus: { register: (type: string) => void registered.push(type) },
    } as never).init();

    assert.deepEqual(registered, [applyCouponCommand.type]);
  });
});
