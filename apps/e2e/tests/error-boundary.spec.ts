import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT, ROUTES } from './helpers';

const MISSING_PRODUCT = '/products/does-not-exist';
const NOT_FOUND_HEADING = { name: 'Page not found' } as const;
const UNAVAILABLE_HEADING = { name: 'Service unavailable' } as const;

test('a missing product answers 404 and renders the not-found page', async ({
  page,
}) => {
  const response = await page.goto(MISSING_PRODUCT);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', NOT_FOUND_HEADING)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the store' })).toBeVisible();
});

test('an unknown route renders the same not-found page', async ({ page }) => {
  const response = await page.goto('/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', NOT_FOUND_HEADING)).toBeVisible();
});

test('a 503 from the API renders the service-unavailable screen', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.products);

  // Scoped to the product endpoint so the boundary's own health probes still
  // reach the real /healthz and /api/health routes.
  await page.route('**/api/v1/products/voyager-hoodie', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 503,
        message: 'Service unavailable',
        error: 'Service Unavailable',
        correlationId: 'e2e503',
      }),
    }),
  );

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(page.getByRole('heading', UNAVAILABLE_HEADING)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Refresh the page' }),
  ).toBeVisible();
});
