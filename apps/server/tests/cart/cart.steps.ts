import assert from 'node:assert';
import { After, Given, Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

const TEST_PRODUCT_ID = 'cart-e2e-product';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface CartTestContext {
  cartId?: string;
  mintedCartIds: string[];
}

function cartContext(world: ICustomWorld): CartTestContext {
  world.context.mintedCartIds ??= [];
  return world.context as unknown as CartTestContext;
}

function latestBody(world: ICustomWorld): Record<string, unknown> {
  return JSON.parse(world.context.latestResponse!.body);
}

async function addItem(world: ICustomWorld, payload: Record<string, unknown>): Promise<void> {
  world.context.latestResponse = await world.server.inject({
    method: 'POST',
    url: '/api/v1/carts/items',
    payload,
  });
  if (world.context.latestResponse.statusCode === 200) {
    const context = cartContext(world);
    context.cartId = latestBody(world).id as string;
    context.mintedCartIds.push(context.cartId);
  }
}

Given(
  'an inventory item {string} with stock {int}',
  async function (this: ICustomWorld, sku: string, stock: number) {
    await this.db`
      INSERT INTO products (product_id, name, description, category, collection)
      VALUES (${TEST_PRODUCT_ID}, 'Cart Test Product', 'Fixture for cart e2e', 'unisex', 'urban')
      ON CONFLICT (product_id) DO NOTHING
    `;
    await this.db`
      INSERT INTO product_inventory (sku, product_id, color, size, list_price, sale_price, stock)
      VALUES (${sku}, ${TEST_PRODUCT_ID}, 'black', NULL, 10, 10, ${stock})
      ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock
    `;
  },
);

When(
  'I add {int} unit/units of {string} to a new cart',
  async function (this: ICustomWorld, quantity: number, sku: string) {
    await addItem(this, { sku, quantity });
  },
);

When(
  'I add {int} unit/units of {string} to the cart',
  async function (this: ICustomWorld, quantity: number, sku: string) {
    await addItem(this, { cartId: cartContext(this).cartId, sku, quantity });
  },
);

When(
  'I add {int} unit/units of {string} to the unknown cart {string}',
  async function (this: ICustomWorld, quantity: number, sku: string, cartId: string) {
    await addItem(this, { cartId, sku, quantity });
  },
);

When('I get the cart', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `/api/v1/carts/${cartContext(this).cartId}`,
  });
});

When('I get the cart {string}', async function (this: ICustomWorld, cartId: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `/api/v1/carts/${cartId}`,
  });
});

When(
  'I set the quantity of {string} to {int}',
  async function (this: ICustomWorld, sku: string, quantity: number) {
    this.context.latestResponse = await this.server.inject({
      method: 'PATCH',
      url: `/api/v1/carts/${cartContext(this).cartId}/items/${sku}`,
      payload: { quantity },
    });
  },
);

When('I remove {string} from the cart', async function (this: ICustomWorld, sku: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'DELETE',
    url: `/api/v1/carts/${cartContext(this).cartId}/items/${sku}`,
  });
});

Then('the response returns a cart identifier', function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, 200);
  assert.match(latestBody(this).id as string, UUID_PATTERN);
});

Then(
  'the cart has {int} line/lines and {int} total unit/units',
  function (this: ICustomWorld, lineCount: number, totalUnits: number) {
    assert.strictEqual(this.context.latestResponse!.statusCode, 200);
    const body = latestBody(this);
    assert.strictEqual((body.lines as unknown[]).length, lineCount);
    assert.strictEqual(body.totalUnits, totalUnits);
  },
);

Then(
  'the cart line {string} has quantity {int}',
  function (this: ICustomWorld, sku: string, quantity: number) {
    assert.strictEqual(this.context.latestResponse!.statusCode, 200);
    const lines = latestBody(this).lines as { sku: string; quantity: number }[];
    const line = lines.find((candidate) => candidate.sku === sku);
    assert.ok(line, `expected a line for ${sku}`);
    assert.strictEqual(line.quantity, quantity);
  },
);

Then('the cart lines carry no prices', function (this: ICustomWorld) {
  const lines = latestBody(this).lines as Record<string, unknown>[];
  assert.ok(lines.length > 0, 'expected at least one line');
  for (const line of lines) {
    assert.deepStrictEqual(Object.keys(line).sort(), ['quantity', 'sku']);
  }
});

Then('the response carries the error envelope', function (this: ICustomWorld) {
  const body = latestBody(this);
  assert.strictEqual(typeof body.statusCode, 'number');
  assert.strictEqual(typeof body.error, 'string');
  assert.strictEqual(typeof body.message, 'string');
  assert.strictEqual(typeof body.correlationId, 'string');
});

After({ tags: '@cart' }, async function (this: ICustomWorld) {
  const { mintedCartIds } = cartContext(this);
  if (mintedCartIds.length > 0) {
    await this.db`DELETE FROM carts WHERE cart_id = ANY(${mintedCartIds}::uuid[])`;
  }
  await this.db`DELETE FROM products WHERE product_id = ${TEST_PRODUCT_ID}`;
});
