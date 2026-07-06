import { expect, test } from '@playwright/test';
import { gotoHydrated, ROUTES } from './helpers';

const OPEN_MENU = { name: 'Open menu' } as const;
const CLOSE_MENU = { name: 'Close menu' } as const;
const DRAWER = { name: 'Site menu' } as const;

test.beforeEach(async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);
});

test('opens and closes the drawer', async ({ page }) => {
  const menuButton = page.getByRole('button', OPEN_MENU);
  const drawer = page.getByRole('dialog', DRAWER);

  await expect(drawer).toBeHidden();
  await menuButton.click();

  await expect(drawer).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  await drawer.getByRole('button', CLOSE_MENU).click();

  await expect(drawer).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

test('navigates from a drawer link and closes it', async ({ page }) => {
  await page.getByRole('button', OPEN_MENU).click();

  const drawer = page.getByRole('dialog', DRAWER);
  await drawer.getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(ROUTES.about);
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
});
