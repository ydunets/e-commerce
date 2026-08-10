import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { API_PREFIX, PRODUCT } from './helpers';

const ADD_TO_CART = { name: 'Add to Cart' } as const;
const INCREASE = { name: 'Increase quantity' } as const;

// Mirrors CART_ID_STORAGE_KEY in apps/client/src/entities/cart/lib/cartStorage.ts.
const CART_ID_STORAGE_KEY = 'stylenest.cart-id';
const STALE_CART_ID = '00000000-0000-4000-8000-000000000000';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Seeded data: autumnal-knitwear defaults to blue / XS with 15 in stock.
const LOW_STOCK_PRODUCT_PATH = '/products/autumnal-knitwear';
const LOW_STOCK = 15;

type CartResponse = {
  id: string;
  lines: { sku: string; quantity: number }[];
  totalUnits: number;
};

const cartLink = (page: Page) =>
  page.getByRole('link', { name: /shopping bag/i });

const storedCartId = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), CART_ID_STORAGE_KEY);

/** Reads the server-side cart, or null while it is not readable yet. */
async function serverCart(
  api: APIRequestContext,
  cartId: string,
): Promise<CartResponse | null> {
  const response = await api.get(`${API_PREFIX}/carts/${cartId}`);
  return response.ok() ? ((await response.json()) as CartResponse) : null;
}

test(
  'adding to cart updates the navbar badge without a reload',
  { tag: ['@smoke', '@critical'] },
  async ({ api, gotoHydrated, page }, testInfo) => {
    await test.step('open the product with an empty bag', async () => {
      await gotoHydrated(PRODUCT.path);
      await expect(cartLink(page)).toHaveCartCount(0);
    });

    await test.step('add the first unit', async () => {
      await page.getByRole('button', ADD_TO_CART).click();
      await expect(cartLink(page)).toHaveCartCount(1);
    });

    await test.step('add the second unit', async () => {
      await page.getByRole('button', ADD_TO_CART).click();
      await expect(cartLink(page)).toHaveCartCount(2);
    });

    const cartId = await storedCartId(page);
    expect(cartId).toMatch(UUID_PATTERN);

    // Attached before the assertion, so a failure carries the state that
    // produced it rather than nothing at all.
    await testInfo.attach('server-cart.json', {
      body: JSON.stringify(await serverCart(api, cartId!), null, 2),
      contentType: 'application/json',
    });

    // The click resolves before the write lands, so the server side is
    // eventually consistent from here.
    await expect
      .poll(async () => (await serverCart(api, cartId!))?.totalUnits, {
        message: 'the server cart must report both clicks',
      })
      .toBe(2);
  },
);

test('the badge survives reload and navigation, persisting only the cart id', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(PRODUCT.path);
  await page.getByRole('button', ADD_TO_CART).click();
  await expect(cartLink(page)).toHaveCartCount(1);

  await gotoHydrated(PRODUCT.path);
  await expect(cartLink(page)).toHaveCartCount(1);

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Home' })
    .click();
  await expect(cartLink(page)).toHaveCartCount(1);

  const storage = await page.evaluate(() => Object.keys(localStorage));
  expect(storage).toEqual([CART_ID_STORAGE_KEY]);
  expect(await storedCartId(page)).toMatch(UUID_PATTERN);
});

test('a stale cart id self-heals without a user-visible error', async ({
  gotoHydrated,
  page,
}) => {
  await page.addInitScript(
    ([key, id]) => localStorage.setItem(key, id),
    [CART_ID_STORAGE_KEY, STALE_CART_ID],
  );

  await gotoHydrated(PRODUCT.path);
  await page.getByRole('button', ADD_TO_CART).click();

  await expect(cartLink(page)).toHaveCartCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);

  const freshId = await storedCartId(page);
  expect(freshId).toMatch(UUID_PATTERN);
  expect(freshId).not.toBe(STALE_CART_ID);
});

// Seeded data: classic-canvas-tee's beige colour has zero stock in every size.
const SOLD_OUT_PRODUCT_PATH = '/products/classic-canvas-tee';
const SOLD_OUT_COLOR = { name: 'Beige (out of stock)' } as const;

test(
  'a sold-out colour keeps Add to Cart disabled with the notice',
  { tag: '@critical' },
  async ({ gotoHydrated, page }) => {
    await gotoHydrated(SOLD_OUT_PRODUCT_PATH);

    await page.getByRole('radio', SOLD_OUT_COLOR).click();

    await expect(
      page.getByText('Sorry, this item is out of stock'),
    ).toBeVisible();
    await expect(page.getByRole('button', ADD_TO_CART)).toBeDisabled();
  },
);

test(
  'the stepper increment disables at the stock cap',
  {
    tag: '@slow',
    annotation: {
      type: 'runtime',
      description: `clicks the stepper ${LOW_STOCK - 1} times to reach the cap`,
    },
  },
  async ({ gotoHydrated, page }) => {
    await gotoHydrated(LOW_STOCK_PRODUCT_PATH);

    const increase = page.getByRole('button', INCREASE);
    const quantity = page.locator('[aria-live="polite"]');

    for (let clicks = 1; clicks < LOW_STOCK; clicks += 1) {
      await increase.click();
    }

    await expect(quantity).toHaveText(String(LOW_STOCK));
    await expect(increase).toBeDisabled();
  },
);
