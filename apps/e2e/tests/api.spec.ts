import { expect, test } from './fixtures';
import {
  API_PREFIX,
  type CartResponse,
  PRODUCT,
  uniqueEmail,
} from './helpers';

const HEALTH_ROUTE = '/health';
const OPENAPI_ROUTE = '/api-docs/json';
const OPENAPI_VERSION = '3.1.0';

// A cold container provisions its schema while starting, so readiness needs
// room without letting a genuinely dead API stall the whole run.
const READINESS_TIMEOUT_MS = 30_000;
const READINESS_INTERVALS_MS = [250, 500, 1_000];

// Seeded data: autumnal-knitwear carries 8 reviews averaging 4.25 stars.
const REVIEWED_PRODUCT = 'autumnal-knitwear';
const REVIEW_COUNT = 8;
const PAGE_SIZE = 2;
// The querystring schema caps the rating filter at five stars.
const OUT_OF_RANGE_RATING = 9;

const UNKNOWN_CART_ID = '00000000-0000-4000-8000-000000000000';
const MALFORMED_CART_ID = 'not-a-uuid';
const UNKNOWN_SKU = 'no-such-sku';

const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;

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

type ValidationError = {
  statusCode: number;
  error: string;
  subErrors?: { path: string; message: string }[];
};

test.describe('the storefront API', { tag: '@critical' }, () => {
  // Readiness is genuinely eventual rather than merely slow, which is what
  // separates a retrying assertion from a polled value here.
  test.beforeAll(async ({ api }) => {
    await expect(async () => {
      const response = await api.get(HEALTH_ROUTE);
      expect(response).toBeOK();
      expect(await response.json()).toEqual({ status: 'ok' });
    }).toPass({
      intervals: READINESS_INTERVALS_MS,
      timeout: READINESS_TIMEOUT_MS,
    });
  });

  test('should document every route the browser specs depend on', async ({
    api,
  }) => {
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

  test('should keep the cart consistent when lines are added, raised and removed', async ({
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
      // Compared against what the write answered, not against a recorded
      // shape: the claim is that reading returns what writing reported.
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
      const cart = (await response.json()) as CartResponse;
      expect(cart.lines.map((line) => line.sku)).toEqual([PRODUCT.secondSku]);
      expect(cart.totalUnits).toBe(1);
    });

    await test.step('removing an absent line answers 404', async () => {
      const response = await api.delete(
        `${API_PREFIX}/carts/${cartId}/items/${PRODUCT.sku}`,
      );
      expect(response.status()).toBe(STATUS_NOT_FOUND);
    });
  });

  test('should reject the request when the sku is unknown, the cart is unknown or the cart id is malformed', async ({
    api,
  }) => {
    const unknownSku = await api.post(`${API_PREFIX}/carts/items`, {
      data: { sku: UNKNOWN_SKU, quantity: 1 },
    });
    expect(unknownSku.status()).toBe(STATUS_NOT_FOUND);

    const unknownCart = await api.get(
      `${API_PREFIX}/carts/${UNKNOWN_CART_ID}`,
    );
    expect(unknownCart.status()).toBe(STATUS_NOT_FOUND);

    const malformed = await api.get(
      `${API_PREFIX}/carts/${MALFORMED_CART_ID}`,
    );
    expect(malformed.status()).toBe(STATUS_BAD_REQUEST);
    const body = (await malformed.json()) as ValidationError;
    // The offending field, not the validator's wording: the message text
    // belongs to the server's own unit specs.
    expect(body.subErrors?.[0]?.path).toBe('/cartId');
  });

  test('should accept a subscription when the address is valid and reject it when it is malformed', async ({
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
    expect(rejected.status()).toBe(STATUS_BAD_REQUEST);
    const body = (await rejected.json()) as ValidationError;
    expect(body.error).toBe('Bad Request');
    expect(body.subErrors?.[0]?.path).toBe('/email');
  });

  test('should return one page of reviews and a summary that accounts for every review', async ({
    api,
  }) => {
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

  test('should reject the request when the rating filter falls outside the star range', async ({
    api,
  }) => {
    const response = await api.get(
      `${API_PREFIX}/products/${REVIEWED_PRODUCT}/reviews?rating=${OUT_OF_RANGE_RATING}`,
    );

    expect(response.status()).toBe(STATUS_BAD_REQUEST);
    const body = (await response.json()) as ValidationError;
    expect(body.subErrors?.[0]?.path).toBe('/rating');
  });
});
