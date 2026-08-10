import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

// Every test here forces the API to fail, so the router's ApiError and React's
// boundary log are the expected consequence rather than a defect.
test.use({
  allowedConsoleErrors: [
    ...BLOCKED_REQUEST_NOISE,
    'ApiError:',
    'The above error occurred in',
  ],
});

const MISSING_PRODUCT = '/products/does-not-exist';
const NOT_FOUND_HEADING = { name: 'Page not found' } as const;
const UNAVAILABLE_HEADING = { name: 'Service unavailable' } as const;
const SERVER_ERROR_BODY = {
  statusCode: 500,
  message: 'Internal Server Error',
  error: 'Internal Server Error',
} as const;

// Scoped to the product endpoint so the boundary's own health probes still
// reach the real /healthz and /api/health routes unless a test intercepts
// them on purpose.
async function failProductRequest(
  page: Page,
  status: number,
  body: Record<string, unknown>,
): Promise<void> {
  await page.route('**/api/v1/products/voyager-hoodie', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

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
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.products);
  await failProductRequest(page, 503, {
    statusCode: 503,
    message: 'Service unavailable',
    error: 'Service Unavailable',
    correlationId: 'e2e503',
  });

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(page.getByRole('heading', UNAVAILABLE_HEADING)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Refresh the page' }),
  ).toBeVisible();
});

test('a 400 from the API renders the bad-request screen with its field errors', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.products);
  await failProductRequest(page, 400, {
    statusCode: 400,
    message: 'Validation error',
    error: 'Bad Request',
    correlationId: 'e2e400',
    subErrors: [{ path: '/email', message: 'must be an email' }],
  });

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(page.getByRole('heading', { name: 'Bad request' })).toBeVisible();
  await expect(page.getByText('must be an email')).toBeVisible();
  await expect(page.getByText('Reference: e2e400')).toBeVisible();
});

test('a 500 from the API renders the server-error screen with a retry action', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.products);
  await failProductRequest(page, 500, SERVER_ERROR_BODY);

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(
    page.getByRole('heading', { name: 'Something went wrong on our end' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('a dead API health probe reports the store service outage', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.products);
  await page.route('**/api/health', (route) => route.fulfill({ status: 503 }));
  await failProductRequest(page, 502, {
    statusCode: 502,
    message: 'The store service is unreachable.',
    error: 'Bad Gateway',
  });

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(
    page.getByRole('heading', { name: 'The store service is unavailable' }),
  ).toBeVisible();
});

test('an unreachable app server replaces the status screen', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.products);
  await page.route('**/healthz', (route) => route.abort());
  await page.route('**/api/health', (route) => route.abort());
  await failProductRequest(page, 500, SERVER_ERROR_BODY);

  await page.getByRole('link', { name: PRODUCT.name }).first().click();

  await expect(
    page.getByRole('heading', { name: 'Cannot reach the app server' }),
  ).toBeVisible();
});
