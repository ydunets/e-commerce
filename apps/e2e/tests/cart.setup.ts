import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from './fixtures';
import {
  API_PREFIX,
  CART_ID_STORAGE_KEY,
  type CartResponse,
  readJson,
  SEEDED_CART,
  SEEDED_CART_STATE,
} from './helpers';

/**
 * Creates the cart the cart specs start from, over the same public API a
 * shopper's browser would use, and hands it to them as browser storage state.
 * Nothing here touches the database directly: the e2e Postgres is shared with
 * whatever dev stack is running, and it carries no volume.
 */
setup('seed a cart and write its browser storage state', async ({
  api,
  baseURL,
  page,
}) => {
  const response = await api.post(`${API_PREFIX}/carts/items`, {
    data: { sku: SEEDED_CART.sku, quantity: SEEDED_CART.quantity },
  });
  expect(response, 'the seeded cart must be created over the public API').toBeOK();

  const cart = await readJson<CartResponse>(response);
  expect(cart.totalUnits).toBe(SEEDED_CART.quantity);

  // localStorage is per origin, so the state has to be written from a page on
  // the origin the specs will open.
  await page.goto(baseURL ?? '/');
  await page.evaluate(
    ([key, id]) => localStorage.setItem(key, id),
    [CART_ID_STORAGE_KEY, cart.id],
  );

  mkdirSync(dirname(SEEDED_CART_STATE), { recursive: true });
  await page.context().storageState({ path: SEEDED_CART_STATE });
});
