import assert from 'node:assert';
import { After, type DataTable, Given, Then, When } from '@cucumber/cucumber';
import type { CartResponseDto, ValidateCartResponseDto } from '@e-commerce/contracts';
import { assertKeys, STATUS_OK } from '../shared/http.js';
import type { ICustomWorld } from '../support/custom-world.js';

const TEST_PRODUCT_ID = 'char-cart-product';
const TEST_PRODUCT_NAME = 'Cart Test Product';
const TEST_PRODUCT_DESCRIPTION = 'Fixture for cart characterisation';
const CARTS_URL = '/api/v1/carts';
const TEST_PRODUCT_PREFIX = 'char-cart-';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

Given('inventory item {string} is removed', async function (this: ICustomWorld, sku: string) {
  assert.ok(sku.startsWith(TEST_PRODUCT_PREFIX));
  await this.db`DELETE FROM product_inventory WHERE sku = ${sku}`;
});

Then(
  'the stock conflict describes {string} with requested {int} and available {int}',
  function (this: ICustomWorld, sku: string, requested: number, available: number) {
    assert.deepStrictEqual(latestBody(this).details, { sku, requested, available });
  },
);

interface CartTestContext {
  cartId?: string;
  mintedCartIds: string[];
  validatedCart?: CartResponseDto;
  recordedCart?: CartResponseDto;
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
      VALUES (${TEST_PRODUCT_ID}, ${TEST_PRODUCT_NAME}, ${TEST_PRODUCT_DESCRIPTION}, 'unisex', 'urban')
      ON CONFLICT (product_id) DO NOTHING
    `;
    await this.db`
      INSERT INTO product_inventory (sku, product_id, color, size, list_price, sale_price, stock)
      VALUES (${sku}, ${TEST_PRODUCT_ID}, 'black', NULL, 10, 10, ${stock})
      ON CONFLICT (sku) DO UPDATE SET stock = EXCLUDED.stock
    `;
  },
);

Given(
  'inventory item {string} now has list price {int}, discount {int} and sale price {int}',
  async function (
    this: ICustomWorld,
    sku: string,
    listPrice: number,
    discountPercentage: number,
    salePrice: number,
  ) {
    await this.db`
      UPDATE product_inventory
      SET list_price = ${listPrice}, discount_percentage = ${discountPercentage}, sale_price = ${salePrice}
      WHERE sku = ${sku}
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

Then(
  'the cart lines carry product details and current prices:',
  function (this: ICustomWorld, expectedLines: DataTable) {
    const lines = expectedLines.hashes().map((line) => ({
      sku: line.sku,
      quantity: Number(line.quantity),
      product_id: TEST_PRODUCT_ID,
      name: TEST_PRODUCT_NAME,
      description: TEST_PRODUCT_DESCRIPTION,
      color: 'black',
      size: null,
      image_url: null,
      list_price: Number(line.list_price),
      discount_percentage:
        line.discount_percentage === 'null' ? null : Number(line.discount_percentage),
      sale_price: Number(line.sale_price),
      stock: Number(line.stock),
    }));
    assert.deepStrictEqual(latestBody(this).lines, lines);
  },
);

Given(
  'inventory item {string} now has stock {int}',
  async function (this: ICustomWorld, sku: string, stock: number) {
    await this.db`UPDATE product_inventory SET stock = ${stock} WHERE sku = ${sku}`;
  },
);

Given('the current cart identifier is {string}', function (this: ICustomWorld, cartId: string) {
  cartContext(this).cartId = cartId;
});

When('I validate the cart stock', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: `${CARTS_URL}/${cartContext(this).cartId}/validate`,
  });
});

function stockValidation(world: ICustomWorld): ValidateCartResponseDto {
  assert.strictEqual(world.context.latestResponse!.statusCode, STATUS_OK);
  const response = world.context.latestResponse!.json<ValidateCartResponseDto>();
  assertKeys(response, ['cart', 'changes']);
  assert.strictEqual(response.cart.id, cartContext(world).cartId);
  cartContext(world).validatedCart = response.cart;
  return response;
}

Then('stock validation reports:', function (this: ICustomWorld, expectedChanges: DataTable) {
  const expected = expectedChanges.hashes().map((change) => ({
    sku: change.sku,
    name: TEST_PRODUCT_NAME,
    previous_quantity: Number(change.previous_quantity),
    quantity: Number(change.quantity),
    stock: Number(change.stock),
  }));
  assert.deepStrictEqual(stockValidation(this).changes, expected);
});

Then('stock validation reports no changes', function (this: ICustomWorld) {
  assert.deepStrictEqual(stockValidation(this).changes, []);
});

Then('the cart matches the stock validation response', function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.deepStrictEqual(latestBody(this), cartContext(this).validatedCart);
});

When('I apply coupon {string}', async function (this: ICustomWorld, code: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: `${CARTS_URL}/${cartContext(this).cartId}/coupons`,
    payload: { code },
  });
});

When('I remove coupon {string}', async function (this: ICustomWorld, code: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'DELETE',
    url: `${CARTS_URL}/${cartContext(this).cartId}/coupons/${code}`,
  });
});

Then('the cart coupons are:', function (this: ICustomWorld, expectedCoupons: DataTable) {
  assert.strictEqual(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.strictEqual(latestBody(this).id, cartContext(this).cartId);
  assert.deepStrictEqual(
    latestBody(this).coupons,
    expectedCoupons.hashes().map((coupon) => ({
      code: coupon.code,
      discount_type: coupon.discount_type,
      value: Number(coupon.value),
    })),
  );
});

Given('I record the cart response', function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, STATUS_OK);
  cartContext(this).recordedCart = this.context.latestResponse!.json<CartResponseDto>();
});

Then('the cart response is unchanged', function (this: ICustomWorld) {
  assert.strictEqual(this.context.latestResponse!.statusCode, STATUS_OK);
  assert.deepStrictEqual(latestBody(this), cartContext(this).recordedCart);
});

After({ tags: '@cart' }, async function (this: ICustomWorld) {
  const { mintedCartIds } = cartContext(this);
  if (mintedCartIds.length > 0) {
    await this.db`DELETE FROM carts WHERE cart_id = ANY(${mintedCartIds}::uuid[])`;
  }
  await this.db`DELETE FROM products WHERE product_id LIKE ${`${TEST_PRODUCT_PREFIX}%`}`;
});
