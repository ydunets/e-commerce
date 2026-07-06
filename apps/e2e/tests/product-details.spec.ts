import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT } from './helpers';

const COLOR_GREEN = { name: 'Green' } as const;
const COLOR_BROWN = { name: 'Brown' } as const;
const INCREASE = { name: 'Increase quantity' } as const;
const DECREASE = { name: 'Decrease quantity' } as const;
const ADD_TO_CART = { name: 'Add to Cart' } as const;

const INITIAL_QUANTITY = '1';
const INCREMENTED_QUANTITY = '2';

test.beforeEach(async ({ page }) => {
  await gotoHydrated(page, PRODUCT.path);
});

test('server-renders the product with price and rating', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: PRODUCT.name }),
  ).toBeVisible();
  await expect(page.getByText('20% OFF')).toBeVisible();
  await expect(page.getByRole('link', { name: /reviews/ })).toBeVisible();
  await expect(page.getByRole('button', ADD_TO_CART)).toBeEnabled();
});

test('selecting a colour updates the swatch and the gallery', async ({
  page,
}) => {
  const green = page.getByRole('radio', COLOR_GREEN);
  const brown = page.getByRole('radio', COLOR_BROWN);
  const mainImage = page.getByRole('img', { name: PRODUCT.name });
  // Seeded data: green has several images (thumbnails shown), brown has one
  // (the gallery collapses to just the main image).
  const thumbnails = page.getByRole('button', { name: /View image/ });

  await expect(green).toBeChecked();
  await expect(thumbnails.first()).toBeVisible();

  await brown.click();

  await expect(brown).toBeChecked();
  await expect(green).not.toBeChecked();
  await expect(mainImage).toBeVisible();
  await expect(thumbnails).toHaveCount(0);

  await green.click();

  await expect(green).toBeChecked();
  await expect(thumbnails.first()).toBeVisible();
});

test('quantity stepper increments and respects the minimum', async ({
  page,
}) => {
  const increase = page.getByRole('button', INCREASE);
  const decrease = page.getByRole('button', DECREASE);
  const quantity = page.locator('[aria-live="polite"]');

  await expect(quantity).toHaveText(INITIAL_QUANTITY);
  await expect(decrease).toBeDisabled();

  await increase.click();

  await expect(quantity).toHaveText(INCREMENTED_QUANTITY);
  await expect(decrease).toBeEnabled();
});
