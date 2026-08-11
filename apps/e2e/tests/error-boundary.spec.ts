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

test('should answer 404 and render the not-found page when the product does not exist', async ({
  page,
}) => {
  const response = await page.goto(MISSING_PRODUCT);

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', NOT_FOUND_HEADING)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the store' })).toBeVisible();
});

test('should render the not-found page when the route is unknown', async ({
  page,
}) => {
  const response = await page.goto('/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', NOT_FOUND_HEADING)).toBeVisible();
});

test('should render the service-unavailable screen when the API answers 503', async ({
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

test('should render the bad-request screen with its field errors when the API answers 400', async ({
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

test('should render the server-error screen with a retry action when the API answers 500', async ({
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

test('should report the store service outage when the API health probe fails', async ({
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

test('should report an unreachable app server when its health probe cannot be reached', async ({
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
