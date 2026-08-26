import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartEntity, EnrichedCartLine } from '#src/modules/cart/domain/cart.types.ts';
import { ConflictException, NotFoundException } from '#src/shared/exceptions/index.ts';
import makeAddItem, { addItemCommand } from './add-item.handler.ts';

const SKU = 'voyager-hoodie-brown-s';

function enrichedLine(sku: string, quantity: number, stock = 10): EnrichedCartLine {
  return {
    sku,
    quantity,
    productId: 'voyager-hoodie',
    name: 'Voyager Hoodie',
    color: 'brown',
    size: 's',
    imageUrl: null,
    listPrice: 95,
    discountPercentage: null,
    salePrice: 95,
    stock,
  };
}

function skuAndQuantity(lines: EnrichedCartLine[]): { sku: string; quantity: number }[] {
  return lines.map(({ sku, quantity }) => ({ sku, quantity }));
}

// The handler re-reads the cart after writing, so the fake repository has to
// reflect its own writes the way the real one does.
function fakeDeps(options: { stock?: number; existingCart?: CartEntity }): {
  deps: Dependencies;
  inserted: CartEntity[];
  upserted: { cartId: string; sku: string; quantity: number }[];
} {
  const inserted: CartEntity[] = [];
  const upserted: { cartId: string; sku: string; quantity: number }[] = [];
  let stored = options.existingCart;
  const deps = {
    queryBus: {
      execute: async () =>
        options.stock === undefined ? undefined : { sku: SKU, stock: options.stock },
    },
    cartRepository: {
      insert: async (cart: CartEntity) => {
        inserted.push(cart);
        stored = cart;
      },
      findOneById: async (id: string) => (stored?.id === id ? stored : undefined),
      upsertLine: async (cartId: string, sku: string, quantity: number) => {
        upserted.push({ cartId, sku, quantity });
        if (stored?.id !== cartId) return;
        const exists = stored.lines.some((line) => line.sku === sku);
        stored = {
          ...stored,
          lines: exists
            ? stored.lines.map((line) => (line.sku === sku ? { ...line, quantity } : line))
            : [enrichedLine(sku, quantity), ...stored.lines],
        };
      },
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
    assert.deepEqual(skuAndQuantity(cart.lines), [{ sku: SKU, quantity: 2 }]);
  });

  it('answers the persisted read model, enriched with product data', async () => {
    const { deps } = fakeDeps({ stock: 5 });

    const cart = await makeAddItem(deps).handler({
      payload: { sku: SKU, quantity: 2 },
    } as never);

    assert.deepEqual(cart.lines, [enrichedLine(SKU, 2)]);
  });

  it('merges the quantity into an existing line instead of duplicating it', async () => {
    const existingCart: CartEntity = {
      id: 'cart-1',
      createdAt: new Date(),
      lines: [enrichedLine(SKU, 2)],
      coupons: [],
    };
    const { deps, inserted, upserted } = fakeDeps({ stock: 5, existingCart });

    const cart = await makeAddItem(deps).handler({
      payload: { cartId: 'cart-1', sku: SKU, quantity: 3 },
    } as never);

    assert.equal(inserted.length, 0);
    assert.deepEqual(upserted, [{ cartId: 'cart-1', sku: SKU, quantity: 5 }]);
    assert.deepEqual(skuAndQuantity(cart.lines), [{ sku: SKU, quantity: 5 }]);
  });

  it('rejects a merged quantity above stock with a conflict', async () => {
    const existingCart: CartEntity = {
      id: 'cart-1',
      createdAt: new Date(),
      lines: [enrichedLine(SKU, 4)],
      coupons: [],
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
