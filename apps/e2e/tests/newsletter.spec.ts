import { expect, test } from '@playwright/test';
import { gotoHydrated, ROUTES, uniqueEmail } from './helpers';

const SUBSCRIBE_ENDPOINT = '**/api/v1/newsletter/subscriptions';
const EMAIL_FIELD = { name: 'Email address' } as const;
const SUBSCRIBE_BUTTON = { name: 'Subscribe' } as const;
const SUCCESS_MESSAGE =
  'Subscription successful! Please check your email to confirm.';
const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';

test('subscribing with a new email shows the success toast and clears the field', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);

  const field = page.getByRole('textbox', EMAIL_FIELD);
  await field.fill(uniqueEmail());
  await page.getByRole('button', SUBSCRIBE_BUTTON).click();

  await expect(page.getByRole('status')).toHaveText(SUCCESS_MESSAGE);
  await expect(field).toHaveValue('');
});

test('an API failure shows the failure toast', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);
  await page.route(SUBSCRIBE_ENDPOINT, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 500,
        message: 'Internal Server Error',
        error: 'Internal Server Error',
      }),
    }),
  );

  await page.getByRole('textbox', EMAIL_FIELD).fill(uniqueEmail());
  await page.getByRole('button', SUBSCRIBE_BUTTON).click();

  await expect(page.getByRole('status')).toHaveText(FAILURE_MESSAGE);
});

test('the Subscribe button is disabled while the request is in flight', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);
  // Holds the response open until the pending state has been observed.
  let releaseResponse = () => {};
  await page.route(SUBSCRIBE_ENDPOINT, async (route) => {
    await new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: SUCCESS_MESSAGE }),
    });
  });

  await page.getByRole('textbox', EMAIL_FIELD).fill(uniqueEmail());
  const button = page.getByRole('button', SUBSCRIBE_BUTTON);
  await button.click();

  await expect(button).toBeDisabled();
  releaseResponse();
  await expect(page.getByRole('status')).toHaveText(SUCCESS_MESSAGE);
  await expect(button).toBeEnabled();
});

test('the form submits from the keyboard', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);
  await page.route(SUBSCRIBE_ENDPOINT, (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: SUCCESS_MESSAGE }),
    }),
  );

  const field = page.getByRole('textbox', EMAIL_FIELD);
  await field.fill(uniqueEmail());
  await field.press('Enter');

  await expect(page.getByRole('status')).toHaveText(SUCCESS_MESSAGE);
});
