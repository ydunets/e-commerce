import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CartRepository } from '#src/modules/cart/database/cart.repository.port';
import type { CartEntity, EnrichedCartLine } from '#src/modules/cart/domain/cart.types';
import type {
  GetInventoryStockQuery,
  GetInventoryStockResult,
} from '#src/modules/product/queries/get-inventory-stock/get-inventory-stock.query';
import { ConflictException, NotFoundException } from '#src/shared/exceptions/index';
import { fakeCartRepository } from '#tests/support/cart-repository.fake';
import { AddItemCommand } from './add-item.command.js';
import { AddItemHandler } from './add-item.handler.js';

const SKU = 'voyager-hoodie-brown-s';

function enrichedLine(sku: string, quantity: number, stock = 10): EnrichedCartLine {
  return {
    sku,
    quantity,
    productId: 'voyager-hoodie',
    name: 'Voyager Hoodie',
    description: 'A hoodie for every journey.',
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
  deps: {
    cartRepository: CartRepository;
    queryBus: { query(query: GetInventoryStockQuery): Promise<GetInventoryStockResult> };
  };
  inserted: CartEntity[];
  upserted: { cartId: string; sku: string; quantity: number }[];
} {
  const inserted: CartEntity[] = [];
  const upserted: { cartId: string; sku: string; quantity: number }[] = [];
  let stored = options.existingCart;
  const deps: {
    cartRepository: CartRepository;
    queryBus: { query(query: GetInventoryStockQuery): Promise<GetInventoryStockResult> };
  } = {
    queryBus: {
      query: async () =>
        options.stock === undefined ? undefined : { sku: SKU, stock: options.stock },
    },
    cartRepository: fakeCartRepository({
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
    }),
  };
  return { deps, inserted, upserted };
}

describe('addItemCommand handler', () => {
  it('mints a cart implicitly when no cartId is given', async () => {
    const { deps, inserted, upserted } = fakeDeps({ stock: 5 });

    const cart = await new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
      new AddItemCommand({ sku: SKU, quantity: 2 }),
    );

    assert.equal(inserted.length, 1);
    assert.equal(cart.id, inserted[0]!.id);
    assert.deepEqual(upserted, [{ cartId: cart.id, sku: SKU, quantity: 2 }]);
    assert.deepEqual(skuAndQuantity(cart.lines), [{ sku: SKU, quantity: 2 }]);
  });

  it('answers the persisted read model, enriched with product data', async () => {
    const { deps } = fakeDeps({ stock: 5 });

    const cart = await new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
      new AddItemCommand({ sku: SKU, quantity: 2 }),
    );

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

    const cart = await new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
      new AddItemCommand({ cartId: 'cart-1', sku: SKU, quantity: 3 }),
    );

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
        new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
          new AddItemCommand({ cartId: 'cart-1', sku: SKU, quantity: 2 }),
        ),
      ConflictException,
    );
    assert.equal(upserted.length, 0);
  });

  it('rejects an out-of-stock sku with a conflict and mints no cart', async () => {
    const { deps, inserted } = fakeDeps({ stock: 0 });

    await assert.rejects(
      () =>
        new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
          new AddItemCommand({ sku: SKU, quantity: 1 }),
        ),
      ConflictException,
    );
    assert.equal(inserted.length, 0);
  });

  it('rejects an unknown sku with not found', async () => {
    const { deps, inserted } = fakeDeps({});

    await assert.rejects(
      () =>
        new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
          new AddItemCommand({ sku: SKU, quantity: 1 }),
        ),
      NotFoundException,
    );
    assert.equal(inserted.length, 0);
  });

  it('rejects an unknown cartId with not found', async () => {
    const { deps } = fakeDeps({ stock: 5 });

    await assert.rejects(
      () =>
        new AddItemHandler(deps.cartRepository, deps.queryBus).execute(
          new AddItemCommand({ cartId: 'missing', sku: SKU, quantity: 1 }),
        ),
      NotFoundException,
    );
  });
});
