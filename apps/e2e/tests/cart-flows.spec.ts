import type { Page } from '@playwright/test';
import type { CartResponseDto } from '../../../packages/contracts/src/cart';
import { BLOCKED_REQUEST_NOISE, expect, test as base } from './fixtures';
import {
  API_PREFIX,
  CART_ID_STORAGE_KEY,
  COOKIE_CHOICE_KEY,
  FIXED_CLOCK,
  PRODUCT,
  ROUTES,
  SEEDED_CART,
  cartLink,
  readJson,
  seedLocalStorage,
} from './helpers';

const CARTS = `${API_PREFIX}/carts`;
const COUPON = 'WELCOME15';
const UNKNOWN_COUPON = 'E2E_UNKNOWN_COUPON';
const DEBOUNCE_MS = 300;
const CONFLICT = 409;
const CORRECTED_QUANTITY = 1;
const test = base.extend<{ cart: CartResponseDto }>({
  cart: async ({ api, page }, use) => {
    const response = await api.post(`${CARTS}/items`, { data: SEEDED_CART });
    expect(response).toBeOK();
    const cart = await readJson<CartResponseDto>(response);
    await seedLocalStorage(page, CART_ID_STORAGE_KEY, cart.id);
    await seedLocalStorage(page, COOKIE_CHOICE_KEY, 'accepted');
    await page.clock.setFixedTime(FIXED_CLOCK);
    await use(cart);
  },
});

const summary = (page: Page) =>
  page.getByRole('region', { name: 'Order Summary' });

// Each mutable test owns its API-created cart. The setup project's shared cart
// and the seeded inventory are never changed by these scenarios.
test.describe('Cart page flows', () => {
  test('coalesces rapid stepper clicks into one absolute PATCH', async ({
    cart,
    page,
    gotoHydrated,
    api,
  }) => {
    await gotoHydrated(ROUTES.cart);
    await expect(cartLink(page)).toHaveCartCount(cart.totalUnits);
    await page.clock.install({ time: FIXED_CLOCK });
    await page.clock.pauseAt(FIXED_CLOCK);
    const patches: unknown[] = [];
    const itemPath = `${CARTS}/${cart.id}/items/${SEEDED_CART.sku}`;
    page.on('request', (request) => {
      if (request.method() === 'PATCH' && request.url().endsWith(itemPath)) {
        patches.push(request.postDataJSON());
      }
    });
    const increase = page.getByRole('button', { name: 'Increase quantity' });
    await increase.click();
    await page.clock.runFor(0);
    await expect(cartLink(page)).toHaveCartCount(3);
    await page.clock.runFor(DEBOUNCE_MS - 1);
    expect(patches).toEqual([]);
    await increase.click();
    await page.clock.runFor(0);
    await expect(cartLink(page)).toHaveCartCount(4);
    await page.clock.runFor(DEBOUNCE_MS - 1);
    expect(patches).toEqual([]);
    const patched = page.waitForResponse(
      (response) =>
        response.url().endsWith(itemPath) &&
        response.request().method() === 'PATCH',
    );
    await page.clock.runFor(1);
    expect((await patched).ok()).toBe(true);
    await page.clock.runFor(DEBOUNCE_MS);
    expect(patches).toEqual([{ quantity: 4 }]);
    const persisted = await readJson<CartResponseDto>(
      await api.get(`${CARTS}/${cart.id}`),
    );
    expect(persisted.lines[0].quantity).toBe(4);
    await page.getByRole('button', { name: 'Decrease quantity' }).click();
    await page.clock.runFor(0);
    await expect(cartLink(page)).toHaveCartCount(3);
    const decreased = page.waitForResponse(
      (response) =>
        response.url().endsWith(itemPath) &&
        response.request().method() === 'PATCH',
    );
    await page.clock.runFor(DEBOUNCE_MS);
    expect((await decreased).ok()).toBe(true);
    await page.clock.resume();
    await gotoHydrated(ROUTES.cart);
    await expect(cartLink(page)).toHaveCartCount(3);
  });

  test(
    'cancels and confirms item removal by keyboard',
    { tag: '@smoke' },
    async ({ cart, page, gotoHydrated, api }) => {
      await gotoHydrated(ROUTES.cart);
      const remove = page.getByRole('button', { name: 'Remove', exact: true });
      await remove.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Confirm item removal' });
      await expect(dialog).toContainText(PRODUCT.name);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(remove).toBeFocused();
      await expect(cartLink(page)).toHaveCartCount(cart.totalUnits);
      await page.keyboard.press('Enter');
      await dialog.getByRole('button', { name: 'Yes', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Your cart is empty' }),
      ).toBeVisible();
      await expect(cartLink(page)).toHaveCartCount(0);
      const persisted = await readJson<CartResponseDto>(
        await api.get(`${CARTS}/${cart.id}`),
      );
      expect(persisted.lines).toEqual([]);
    },
  );

  test(
    'applies and removes a coupon with persisted totals',
    { tag: '@smoke' },
    async ({ cart, page, gotoHydrated, api }) => {
      await gotoHydrated(ROUTES.cart);
      const original = await summary(page).innerText();
      await page.getByRole('button', { name: 'Add coupon code' }).click();
      const field = page.getByRole('textbox', { name: 'Coupon code' });
      await expect(field).toBeFocused();
      await field.fill(COUPON);
      await field.press('Enter');
      const remove = page.getByRole('button', {
        name: `Remove coupon ${COUPON}`,
      });
      await expect(remove).toBeVisible();
      await expect(summary(page)).toContainText('-$');
      const applied = await readJson<CartResponseDto>(
        await api.get(`${CARTS}/${cart.id}`),
      );
      expect(applied.coupons.map((coupon) => coupon.code)).toEqual([COUPON]);
      await remove.click();
      await expect(remove).not.toBeVisible();
      await gotoHydrated(ROUTES.cart);
      await expect(summary(page)).toHaveText(original, { useInnerText: true });
    },
  );

  test.describe('coupon validation', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });
    test('shows empty and unknown code errors and clears them on input', async ({
      cart,
      page,
      gotoHydrated,
    }) => {
      await gotoHydrated(ROUTES.cart);
      await expect(cartLink(page)).toHaveCartCount(cart.totalUnits);
      const writes: string[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/coupons'))
          writes.push(request.postData() ?? '');
      });
      await page.getByRole('button', { name: 'Add coupon code' }).click();
      const field = page.getByRole('textbox', { name: 'Coupon code' });
      await field.fill('   ');
      await field.press('Enter');
      await expect(field).toHaveAccessibleDescription(
        'Please enter a valid code',
      );
      expect(writes).toEqual([]);
      await field.fill(UNKNOWN_COUPON);
      await expect(
        page.getByText('Please enter a valid code'),
      ).not.toBeVisible();
      await field.press('Enter');
      await expect(field).toHaveAccessibleDescription(
        "Sorry, but this coupon doesn't exist",
      );
      expect(writes).toHaveLength(1);
      await field.fill(COUPON);
      await expect(
        page.getByText("Sorry, but this coupon doesn't exist"),
      ).not.toBeVisible();
      await field.press('Enter');
      await expect(
        page.getByRole('button', { name: `Remove coupon ${COUPON}` }),
      ).toBeVisible();
    });
  });
});

test.describe('Stock reconciliation and checkout', () => {
  test.describe('write conflicts', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });
    for (const operation of ['update', 'add'] as const) {
      test(
        `acknowledges an oversold ${operation} with the keyboard`,
        { tag: '@smoke' },
        async ({ cart, page, gotoHydrated }) => {
          const itemPath = `${CARTS}/${cart.id}/items/${SEEDED_CART.sku}`;
          const writePath =
            operation === 'update' ? itemPath : `${CARTS}/items`;
          await gotoHydrated(
            operation === 'update' ? ROUTES.cart : PRODUCT.path,
          );
          await expect(cartLink(page)).toHaveCartCount(cart.totalUnits);
          if (operation === 'add') {
            await page
              .getByRole('radio', { name: 'Green', exact: true })
              .click();
            await page.getByRole('radio', { name: 'M', exact: true }).click();
          }
          await page.route(
            `**${writePath}`,
            async (route) => {
              if (
                route.request().method() !==
                (operation === 'update' ? 'PATCH' : 'POST')
              )
                return route.continue();
              await route.fulfill({
                status: CONFLICT,
                json: {
                  statusCode: CONFLICT,
                  error: 'Conflict',
                  message: 'Insufficient stock',
                  details: {
                    sku: SEEDED_CART.sku,
                    requested: 3,
                    available: CORRECTED_QUANTITY,
                  },
                },
              });
            },
            { times: 1 },
          );
          // Reconciliation reflects changed stock without mutating shared inventory.
          const corrected = {
            ...cart,
            totalUnits: CORRECTED_QUANTITY,
            lines: cart.lines.map((line) => ({
              ...line,
              quantity: CORRECTED_QUANTITY,
              stock: CORRECTED_QUANTITY,
            })),
          };
          await page.route(`**${CARTS}/${cart.id}`, (route) =>
            route.fulfill({ json: corrected }),
          );
          await page.route(`**${CARTS}/${cart.id}/validate`, (route) =>
            route.fulfill({
              json: {
                cart: corrected,
                changes: [
                  {
                    sku: SEEDED_CART.sku,
                    name: PRODUCT.name,
                    previous_quantity: SEEDED_CART.quantity,
                    quantity: CORRECTED_QUANTITY,
                    stock: CORRECTED_QUANTITY,
                  },
                ],
              },
            }),
          );
          await page
            .getByRole('button', {
              name:
                operation === 'update' ? 'Increase quantity' : 'Add to Cart',
            })
            .click();
          const dialog = page.getByRole('dialog', {
            name: 'Insufficient stock',
          });
          await expect(dialog).toBeVisible();
          await expect(dialog).toContainText('Requested: 3');
          await expect(dialog).toContainText('Available: 1');
          await dialog.getByRole('button', { name: 'Ok', exact: true }).focus();
          await page.keyboard.press('Enter');
          await expect(dialog).not.toBeVisible();
          await expect(cartLink(page)).toHaveCartCount(CORRECTED_QUANTITY);
          await gotoHydrated(ROUTES.cart);
          await expect(
            page.getByRole('button', { name: 'Increase quantity' }),
          ).toBeDisabled();
        },
      );
    }
  });

  test(
    'lists clamped and removed lines before accepting checkout corrections',
    { tag: '@smoke' },
    async ({ cart, page, gotoHydrated, api }) => {
      const added = await api.post(`${CARTS}/items`, {
        data: {
          cartId: cart.id,
          sku: PRODUCT.secondSku,
          quantity: SEEDED_CART.quantity,
        },
      });
      expect(added).toBeOK();
      const populated = await readJson<CartResponseDto>(added);
      const kept = populated.lines.find(
        (line) => line.sku === SEEDED_CART.sku,
      )!;
      const removed = populated.lines.find(
        (line) => line.sku === PRODUCT.secondSku,
      )!;
      const corrected = {
        ...populated,
        totalUnits: CORRECTED_QUANTITY,
        lines: [
          { ...kept, quantity: CORRECTED_QUANTITY, stock: CORRECTED_QUANTITY },
        ],
      };
      await page.route(`**${CARTS}/${cart.id}/validate`, (route) =>
        route.fulfill({
          json: {
            cart: corrected,
            changes: [
              {
                sku: kept.sku,
                name: kept.name,
                previous_quantity: kept.quantity,
                quantity: CORRECTED_QUANTITY,
                stock: CORRECTED_QUANTITY,
              },
              {
                sku: removed.sku,
                name: removed.name,
                previous_quantity: removed.quantity,
                quantity: 0,
                stock: 0,
              },
            ],
          },
        }),
      );
      await gotoHydrated(ROUTES.cart);
      await expect(cartLink(page)).toHaveCartCount(populated.totalUnits);
      await page.getByRole('button', { name: 'Checkout', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Insufficient stock' });
      await expect(dialog).toContainText('Available: 1');
      await expect(dialog).toContainText('Available: 0');
      await expect(dialog.getByRole('listitem')).toHaveCount(2);
      await expect(dialog).toContainText('Green • M');
      await expect(dialog).toContainText('Brown • XS');
      await expect(cartLink(page)).toHaveCartCount(populated.totalUnits);
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(page).toHaveURL(/\/cart$/);
      await expect(cartLink(page)).toHaveCartCount(CORRECTED_QUANTITY);
      await expect(
        page.getByRole('button', { name: 'Remove', exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole('button', { name: 'Increase quantity' }),
      ).toBeDisabled();
      await page.unroute(`**${CARTS}/${cart.id}/validate`);
      await page.route(`**${CARTS}/${cart.id}/validate`, (route) =>
        route.fulfill({ json: { cart: corrected, changes: [] } }),
      );
      await page.getByRole('button', { name: 'Checkout', exact: true }).click();
      await expect(page).toHaveURL(/\/checkout$/);
    },
  );

  test(
    'hands a couponed cart to read-only checkout by keyboard',
    { tag: ['@smoke', '@critical'] },
    async ({ cart, page, gotoHydrated, api }) => {
      expect(
        await api.post(`${CARTS}/${cart.id}/coupons`, {
          data: { code: COUPON },
        }),
      ).toBeOK();
      await gotoHydrated(ROUTES.checkout);
      await expect(page).toHaveURL(/\/cart$/);
      await expect(
        page.getByRole('button', { name: `Remove coupon ${COUPON}` }),
      ).toBeVisible();
      const amounts = await summary(page).locator('dd').allTextContents();
      const total = await summary(page)
        .getByText(/^\$[\d,.]+$/)
        .last()
        .textContent();
      await page.getByRole('button', { name: 'Checkout', exact: true }).focus();
      const validated = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/carts/${cart.id}/validate`) &&
          response.request().method() === 'POST',
      );
      await page.keyboard.press('Enter');
      expect((await validated).ok()).toBe(true);
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(
        page.getByRole('heading', { name: 'Checkout', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('main')).toContainText(PRODUCT.name);
      await expect(
        page.getByText(`Quantity: ${SEEDED_CART.quantity}`, { exact: true }),
      ).toBeVisible();
      await expect(summary(page).locator('dd')).toHaveText(amounts);
      await expect(summary(page)).toContainText(total!);
      await expect(summary(page)).toContainText(COUPON);
      await expect(
        page.getByRole('button', {
          name: /Increase quantity|Decrease quantity|Remove|Checkout/,
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('textbox', { name: 'Coupon code' }),
      ).toHaveCount(0);
    },
  );
});
