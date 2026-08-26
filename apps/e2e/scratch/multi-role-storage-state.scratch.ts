import { expect, test } from '@playwright/test';

/**
 * Two roles, each signed in once and reused by every spec that needs it. The
 * shop's cart is anonymous by design (ADR 0002), so there is no sign-in to
 * record and nothing to tell the roles apart yet.
 */
const ROLE_STATES = {
  shopper: 'scratch/.state/shopper.json',
  administrator: 'scratch/.state/administrator.json',
} as const;

const SIGN_IN_PATH = '/sign-in';

test.skip(
  true,
  'the shop has no accounts, so neither role can be signed in',
);

test('records a storage state per role', async ({ browser }) => {
  for (const [role, statePath] of Object.entries(ROLE_STATES)) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(SIGN_IN_PATH);
    await page.getByRole('textbox', { name: 'Email address' }).fill(`${role}@example.com`);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('status')).toContainText('Signed in');

    await context.storageState({ path: statePath });
    await context.close();
  }
});

test.describe('what each role may reach', () => {
  test.use({ storageState: ROLE_STATES.administrator });

  test('lets an administrator open the orders page', async ({ page }) => {
    await page.goto('/admin/orders');

    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  });
});
