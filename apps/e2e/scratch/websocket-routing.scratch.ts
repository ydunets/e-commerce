import { expect, test } from '@playwright/test';

/**
 * Stock that arrives over a socket, answered by the test rather than by a
 * server. Nothing in the shop opens a socket today: stock is read with the
 * product and enforced again on the server when the cart is written.
 */
const STOCK_FEED = 'ws://localhost:4000/v1/stock';
const SOLD_OUT_MESSAGE = JSON.stringify({ sku: 'vh-green-md', stock: 0 });

test.skip(true, 'the shop opens no socket, so there is nothing to route');

test('shows the item as sold out when the feed says so', async ({ page }) => {
  await page.routeWebSocket(STOCK_FEED, (ws) => {
    ws.onMessage(() => ws.send(SOLD_OUT_MESSAGE));
    ws.send(SOLD_OUT_MESSAGE);
  });

  await page.goto('/products/voyager-hoodie');

  await expect(page.getByText('Sorry, this item is out of stock')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
});
