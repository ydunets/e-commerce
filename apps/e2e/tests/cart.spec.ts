import { expect, type Page, test } from '@playwright/test';
import { gotoHydrated, PRODUCT } from './helpers';

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

const cartLink = (page: Page) =>
  page.getByRole('link', { name: /shopping bag/i });

const storedCartId = (page: Page) =>
  page.evaluate(
    (key) => localStorage.getItem(key),
    CART_ID_STORAGE_KEY,
  );

test('adding to cart updates the navbar badge without a reload', async ({
  page,
}) => {
  await gotoHydrated(page, PRODUCT.path);
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag');

  await page.getByRole('button', ADD_TO_CART).click();
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 1 item');

  await page.getByRole('button', ADD_TO_CART).click();
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 2 items');
});

test('the badge survives reload and navigation, persisting only the cart id', async ({
  page,
}) => {
  await gotoHydrated(page, PRODUCT.path);
  await page.getByRole('button', ADD_TO_CART).click();
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 1 item');

  await gotoHydrated(page, PRODUCT.path);
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 1 item');

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Home' })
    .click();
  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 1 item');

  const storage = await page.evaluate(() => Object.keys(localStorage));
  expect(storage).toEqual([CART_ID_STORAGE_KEY]);
  expect(await storedCartId(page)).toMatch(UUID_PATTERN);
});

test('a stale cart id self-heals without a user-visible error', async ({
  page,
}) => {
  await page.addInitScript(
    ([key, id]) => localStorage.setItem(key, id),
    [CART_ID_STORAGE_KEY, STALE_CART_ID],
  );

  await gotoHydrated(page, PRODUCT.path);
  await page.getByRole('button', ADD_TO_CART).click();

  await expect(cartLink(page)).toHaveAccessibleName('Shopping bag, 1 item');
  await expect(page.getByRole('alert')).toHaveCount(0);

  const freshId = await storedCartId(page);
  expect(freshId).toMatch(UUID_PATTERN);
  expect(freshId).not.toBe(STALE_CART_ID);
});

test('the stepper increment disables at the stock cap', async ({ page }) => {
  await gotoHydrated(page, LOW_STOCK_PRODUCT_PATH);

  const increase = page.getByRole('button', INCREASE);
  const quantity = page.locator('[aria-live="polite"]');

  for (let clicks = 1; clicks < LOW_STOCK; clicks += 1) {
    await increase.click();
  }

  await expect(quantity).toHaveText(String(LOW_STOCK));
  await expect(increase).toBeDisabled();
});
