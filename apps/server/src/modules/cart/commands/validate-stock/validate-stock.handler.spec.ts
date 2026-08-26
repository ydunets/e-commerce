import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CartEntity,
  EnrichedCartLine,
  StockChange,
} from '#src/modules/cart/domain/cart.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';
import makeValidateStock, { validateStockCommand } from './validate-stock.handler.ts';

function enrichedLine(sku: string, quantity: number, stock: number): EnrichedCartLine {
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

function cartWith(lines: EnrichedCartLine[]): CartEntity {
  return { id: 'cart-1', createdAt: new Date(), lines, coupons: [] };
}

// The handler re-reads the cart after reconciling, so the fake repository has
// to reflect the applied changes the way the real one does.
function fakeDeps(options: { cart?: CartEntity }): {
  deps: Dependencies;
  reconciled: { cartId: string; changes: StockChange[] }[];
} {
  const reconciled: { cartId: string; changes: StockChange[] }[] = [];
  let stored = options.cart;
  const deps = {
    cartRepository: {
      findOneById: async (id: string) => (stored?.id === id ? stored : undefined),
      applyStockChanges: async (cartId: string, changes: StockChange[]) => {
        reconciled.push({ cartId, changes });
        if (stored?.id !== cartId) return;
        const clamped = new Map(changes.map((change) => [change.sku, change.quantity]));
        stored = {
          ...stored,
          lines: stored.lines
            .map((line) => {
              const quantity = clamped.get(line.sku);
              return quantity === undefined ? line : { ...line, quantity };
            })
            .filter((line) => line.quantity > 0),
        };
      },
    },
  } as never as Dependencies;
  return { deps, reconciled };
}

describe('validateStockCommand handler', () => {
  it('answers no changes and writes nothing when every line fits', async () => {
    const cart = cartWith([enrichedLine('sku-a', 2, 5)]);
    const { deps, reconciled } = fakeDeps({ cart });

    const result = await makeValidateStock(deps).handler(
      validateStockCommand({ cartId: 'cart-1' }),
    );

    assert.deepEqual(result.changes, []);
    assert.deepEqual(result.cart, cart);
    assert.equal(reconciled.length, 0);
  });

  it('clamps an oversold line and reports the change', async () => {
    const { deps, reconciled } = fakeDeps({ cart: cartWith([enrichedLine('sku-a', 5, 3)]) });

    const result = await makeValidateStock(deps).handler(
      validateStockCommand({ cartId: 'cart-1' }),
    );

    assert.deepEqual(result.changes, [
      { sku: 'sku-a', name: 'Voyager Hoodie', previousQuantity: 5, quantity: 3, stock: 3 },
    ]);
    assert.deepEqual(result.cart.lines, [enrichedLine('sku-a', 3, 3)]);
    assert.equal(reconciled.length, 1);
  });

  it('drops a sold-out line from the corrected cart', async () => {
    const { deps } = fakeDeps({
      cart: cartWith([enrichedLine('sku-a', 2, 0), enrichedLine('sku-b', 1, 5)]),
    });

    const result = await makeValidateStock(deps).handler(
      validateStockCommand({ cartId: 'cart-1' }),
    );

    assert.deepEqual(
      result.cart.lines.map((line) => line.sku),
      ['sku-b'],
    );
    assert.deepEqual(result.changes, [
      { sku: 'sku-a', name: 'Voyager Hoodie', previousQuantity: 2, quantity: 0, stock: 0 },
    ]);
  });

  it('rejects an unknown cart with not found', async () => {
    const { deps } = fakeDeps({});

    await assert.rejects(
      () => makeValidateStock(deps).handler(validateStockCommand({ cartId: 'missing' })),
      NotFoundException,
    );
  });

  it('registers itself on the command bus under its action type', () => {
    const registered: string[] = [];
    const { deps } = fakeDeps({});

    makeValidateStock({
      ...deps,
      commandBus: { register: (type: string) => void registered.push(type) },
    } as never).init();

    assert.deepEqual(registered, [validateStockCommand.type]);
  });
});
