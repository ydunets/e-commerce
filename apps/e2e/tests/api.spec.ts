import { expect, test } from './fixtures';
import { API_PREFIX, PRODUCT, uniqueEmail } from './helpers';

const HEALTH_ROUTE = '/health';
const OPENAPI_ROUTE = '/api-docs/json';
const OPENAPI_VERSION = '3.1.0';

// Seeded data: autumnal-knitwear carries 8 reviews averaging 4.25 stars.
const REVIEWED_PRODUCT = 'autumnal-knitwear';
const REVIEW_COUNT = 8;
const PAGE_SIZE = 2;

const UNKNOWN_CART_ID = '00000000-0000-4000-8000-000000000000';
const MALFORMED_CART_ID = 'not-a-uuid';
const UNKNOWN_SKU = 'no-such-sku';

/** Every route the browser specs depend on, as the documentation names them. */
const DOCUMENTED_ROUTES = [
  `${API_PREFIX}/carts/items`,
  `${API_PREFIX}/carts/{cartId}`,
  `${API_PREFIX}/carts/{cartId}/items/{sku}`,
  `${API_PREFIX}/newsletter/subscriptions`,
  `${API_PREFIX}/products`,
  `${API_PREFIX}/products/{id}`,
  `${API_PREFIX}/products/{productId}/reviews`,
  `${API_PREFIX}/products/{productId}/reviews/summary`,
  HEALTH_ROUTE,
] as const;

type CartResponse = {
  id: string;
  lines: { sku: string; quantity: number }[];
  totalUnits: number;
};

type ValidationError = {
  statusCode: number;
  error: string;
  subErrors?: { path: string; message: string }[];
};

test.describe('the storefront API', { tag: '@critical' }, () => {
  // A cold container provisions its schema during startup, so readiness is
  // genuinely eventual rather than merely slow.
  test.beforeAll(async ({ api }) => {
    await expect(async () => {
      const response = await api.get(HEALTH_ROUTE);
      expect(response).toBeOK();
      expect(await response.json()).toEqual({ status: 'ok' });
    }).toPass({ intervals: [250, 500, 1_000], timeout: 30_000 });
  });

  test('documents every route the browser specs depend on', async ({ api }) => {
    const response = await api.get(OPENAPI_ROUTE);

    expect(response).toBeOK();
    const document = (await response.json()) as {
      openapi: string;
      paths: Record<string, unknown>;
    };
    expect(document.openapi).toBe(OPENAPI_VERSION);
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([...DOCUMENTED_ROUTES]),
    );
  });

  test('carries a cart through its whole lifecycle', async ({
    api,
  }, testInfo) => {
    let cartId = '';

    const created = await test.step('create the cart implicitly', async () => {
      const response = await api.post(`${API_PREFIX}/carts/items`, {
        data: { sku: PRODUCT.sku, quantity: 2 },
      });
      expect(response).toBeOK();
      const cart = (await response.json()) as CartResponse;
      cartId = cart.id;
      expect(cart.lines).toEqual([{ sku: PRODUCT.sku, quantity: 2 }]);
      expect(cart.totalUnits).toBe(2);
      return cart;
    });

    await testInfo.attach('created-cart.json', {
      body: JSON.stringify(created, null, 2),
      contentType: 'application/json',
    });

    await test.step('read it back', async () => {
      const response = await api.get(`${API_PREFIX}/carts/${cartId}`);
      expect(response).toBeOK();
      expect(await response.json()).toEqual(created);
    });

    await test.step('raise the quantity of a line', async () => {
      const response = await api.patch(
        `${API_PREFIX}/carts/${cartId}/items/${PRODUCT.sku}`,
        { data: { quantity: 3 } },
      );
      expect(response).toBeOK();
      expect((await response.json()) as CartResponse).toMatchObject({
        totalUnits: 3,
      });
    });

    await test.step('append a second line', async () => {
      const response = await api.post(`${API_PREFIX}/carts/items`, {
        data: { cartId, sku: PRODUCT.secondSku, quantity: 1 },
      });
      expect(response).toBeOK();
      const cart = (await response.json()) as CartResponse;
      expect(cart.lines.map((line) => line.sku)).toEqual([
        PRODUCT.sku,
        PRODUCT.secondSku,
      ]);
      expect(cart.totalUnits).toBe(4);
    });

    await test.step('remove the first line', async () => {
      const response = await api.delete(
        `${API_PREFIX}/carts/${cartId}/items/${PRODUCT.sku}`,
      );
      expect(response).toBeOK();
      expect((await response.json()) as CartResponse).toEqual({
        id: cartId,
        lines: [{ sku: PRODUCT.secondSku, quantity: 1 }],
        totalUnits: 1,
      });
    });

    await test.step('removing an absent line answers 404', async () => {
      const response = await api.delete(
        `${API_PREFIX}/carts/${cartId}/items/${PRODUCT.sku}`,
      );
      expect(response.status()).toBe(404);
    });
  });

  test('rejects an unknown sku, an unknown cart, and a malformed cart id', async ({
    api,
  }) => {
    const unknownSku = await api.post(`${API_PREFIX}/carts/items`, {
      data: { sku: UNKNOWN_SKU, quantity: 1 },
    });
    expect(unknownSku.status()).toBe(404);

    const unknownCart = await api.get(
      `${API_PREFIX}/carts/${UNKNOWN_CART_ID}`,
    );
    expect(unknownCart.status()).toBe(404);

    const malformed = await api.get(
      `${API_PREFIX}/carts/${MALFORMED_CART_ID}`,
    );
    expect(malformed.status()).toBe(400);
    const body = (await malformed.json()) as ValidationError;
    expect(body.subErrors).toEqual([
      { path: '/cartId', message: 'must match format "uuid"' },
    ]);
  });

  test('accepts a newsletter subscription and rejects a malformed address', async ({
    api,
  }) => {
    const accepted = await api.post(`${API_PREFIX}/newsletter/subscriptions`, {
      data: { email: uniqueEmail() },
    });
    expect(accepted).toBeOK();
    expect((await accepted.json()) as { message: string }).toHaveProperty(
      'message',
    );

    const rejected = await api.post(`${API_PREFIX}/newsletter/subscriptions`, {
      data: { email: 'not-an-email' },
    });
    expect(rejected.status()).toBe(400);
    const body = (await rejected.json()) as ValidationError;
    expect(body.error).toBe('Bad Request');
    expect(body.subErrors?.[0]?.path).toBe('/email');
  });

  test('paginates reviews and summarises their ratings', async ({ api }) => {
    const page = await api.get(
      `${API_PREFIX}/products/${REVIEWED_PRODUCT}/reviews?page=1&limit=${PAGE_SIZE}`,
    );
    expect(page).toBeOK();
    const paginated = (await page.json()) as {
      count: number;
      limit: number;
      page: number;
      data: unknown[];
    };
    expect(paginated).toMatchObject({
      count: REVIEW_COUNT,
      limit: PAGE_SIZE,
      page: 1,
    });
    expect(paginated.data).toHaveLength(PAGE_SIZE);

    const summary = await api.get(
      `${API_PREFIX}/products/${REVIEWED_PRODUCT}/reviews/summary`,
    );
    expect(summary).toBeOK();
    const ratings = (await summary.json()) as {
      total: number;
      average: number;
      distribution: Record<string, number>;
    };
    expect(ratings.total).toBe(REVIEW_COUNT);
    const counted = Object.values(ratings.distribution).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(counted, 'the distribution must account for every review').toBe(
      REVIEW_COUNT,
    );
  });
});
