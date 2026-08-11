import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { ROUTES, uniqueEmail } from './helpers';

const SUBSCRIBE_ENDPOINT = '**/api/v1/newsletter/subscriptions';
const EMAIL_FIELD = { name: 'Email address' } as const;
const SUBSCRIBE_BUTTON = { name: 'Subscribe' } as const;
const SUCCESS_MESSAGE =
  'Subscription successful! Please check your email to confirm.';
const FAILURE_MESSAGE =
  'Failed to subscribe. Please ensure your email is correct or try again later.';

test.describe('Newsletter Subscription', () => {
  test(
    'should show the success toast and clear the field when a new address is submitted',
    { tag: '@smoke' },
    async ({ gotoHydrated, page }) => {
      await gotoHydrated(ROUTES.home);

      const field = page.getByRole('textbox', EMAIL_FIELD);
      await field.fill(uniqueEmail());
      await page.getByRole('button', SUBSCRIBE_BUTTON).click();

      await expect(page.getByRole('status')).toHaveText(SUCCESS_MESSAGE);
      await expect(field).toHaveValue('');
    },
  );

  // Scoped to the one test that answers the subscription with a 500, which
  // Chromium reports as a resource failure on top of the toast the form
  // renders. The other tests fulfil success responses and stay strict.
  test.describe('when the API fails', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test('should show the failure toast when the subscription request fails', async ({
      gotoHydrated,
      page,
    }) => {
      await gotoHydrated(ROUTES.home);
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
  });

  test(
    'should disable the Subscribe button while the request is in flight',
    {
      annotation: {
        type: 'edge-case',
        description:
          'the response is held open until the pending state has been observed',
      },
    },
    async ({ gotoHydrated, page }) => {
      await gotoHydrated(ROUTES.home);
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
    },
  );

  test('should submit the form when Enter is pressed in the address field', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);
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
});
