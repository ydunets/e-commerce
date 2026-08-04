import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartEntity } from '#src/modules/cart/domain/cart.types.ts';
import { ConflictException, NotFoundException } from '#src/shared/exceptions/index.ts';
import makeAddItem, { addItemCommand } from './add-item.handler.ts';

const SKU = 'voyager-hoodie-brown-s';

function fakeDeps(options: { stock?: number; existingCart?: CartEntity }): {
  deps: Dependencies;
  inserted: CartEntity[];
  upserted: { cartId: string; sku: string; quantity: number }[];
} {
  const inserted: CartEntity[] = [];
  const upserted: { cartId: string; sku: string; quantity: number }[] = [];
  const deps = {
    queryBus: {
      execute: async () =>
        options.stock === undefined ? undefined : { sku: SKU, stock: options.stock },
    },
    cartRepository: {
      insert: async (cart: CartEntity) => void inserted.push(cart),
      findOneById: async (id: string) =>
        options.existingCart?.id === id ? options.existingCart : undefined,
      upsertLine: async (cartId: string, sku: string, quantity: number) =>
        void upserted.push({ cartId, sku, quantity }),
    },
  } as never as Dependencies;
  return { deps, inserted, upserted };
}

describe('addItemCommand handler', () => {
  it('mints a cart implicitly when no cartId is given', async () => {
    const { deps, inserted, upserted } = fakeDeps({ stock: 5 });

    const cart = await makeAddItem(deps).handler({
      payload: { sku: SKU, quantity: 2 },
    } as never);

    assert.equal(inserted.length, 1);
    assert.equal(cart.id, inserted[0]!.id);
    assert.deepEqual(upserted, [{ cartId: cart.id, sku: SKU, quantity: 2 }]);
    assert.deepEqual(cart.lines, [{ sku: SKU, quantity: 2 }]);
  });

  it('merges the quantity into an existing line instead of duplicating it', async () => {
    const existingCart: CartEntity = {
      id: 'cart-1',
      createdAt: new Date(),
      lines: [{ sku: SKU, quantity: 2 }],
    };
    const { deps, inserted, upserted } = fakeDeps({ stock: 5, existingCart });

    const cart = await makeAddItem(deps).handler({
      payload: { cartId: 'cart-1', sku: SKU, quantity: 3 },
    } as never);

    assert.equal(inserted.length, 0);
    assert.deepEqual(upserted, [{ cartId: 'cart-1', sku: SKU, quantity: 5 }]);
    assert.deepEqual(cart.lines, [{ sku: SKU, quantity: 5 }]);
  });

  it('rejects a merged quantity above stock with a conflict', async () => {
    const existingCart: CartEntity = {
      id: 'cart-1',
      createdAt: new Date(),
      lines: [{ sku: SKU, quantity: 4 }],
    };
    const { deps, upserted } = fakeDeps({ stock: 5, existingCart });

    await assert.rejects(
      () =>
        makeAddItem(deps).handler({
          payload: { cartId: 'cart-1', sku: SKU, quantity: 2 },
        } as never),
      ConflictException,
    );
    assert.equal(upserted.length, 0);
  });

  it('rejects an out-of-stock sku with a conflict and mints no cart', async () => {
    const { deps, inserted } = fakeDeps({ stock: 0 });

    await assert.rejects(
      () => makeAddItem(deps).handler({ payload: { sku: SKU, quantity: 1 } } as never),
      ConflictException,
    );
    assert.equal(inserted.length, 0);
  });

  it('rejects an unknown sku with not found', async () => {
    const { deps, inserted } = fakeDeps({});

    await assert.rejects(
      () => makeAddItem(deps).handler({ payload: { sku: SKU, quantity: 1 } } as never),
      NotFoundException,
    );
    assert.equal(inserted.length, 0);
  });

  it('rejects an unknown cartId with not found', async () => {
    const { deps } = fakeDeps({ stock: 5 });

    await assert.rejects(
      () =>
        makeAddItem(deps).handler({
          payload: { cartId: 'missing', sku: SKU, quantity: 1 },
        } as never),
      NotFoundException,
    );
  });

  it('registers itself on the command bus under its action type', () => {
    const registered: string[] = [];
    const { deps } = fakeDeps({ stock: 5 });

    makeAddItem({
      ...deps,
      commandBus: { register: (type: string) => void registered.push(type) },
    } as never).init();

    assert.deepEqual(registered, [addItemCommand.type]);
  });
});
