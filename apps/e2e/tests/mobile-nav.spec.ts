import { expect, test } from './fixtures';
import { ROUTES } from './helpers';

const OPEN_MENU = { name: 'Open menu' } as const;
const CLOSE_MENU = { name: 'Close menu' } as const;
const DRAWER = { name: 'Site menu' } as const;

// The project runs with a touchscreen, so every pointer action here is a tap:
// a click would exercise a device the visitor does not have.
test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ gotoHydrated }) => {
    await gotoHydrated(ROUTES.home);
  });

  test('should open and close the drawer when the menu and close buttons are used', async ({
    page,
  }) => {
    const menuButton = page.getByRole('button', OPEN_MENU);
    const drawer = page.getByRole('dialog', DRAWER);

    await expect(drawer).toBeHidden();
    await menuButton.tap();

    await expect(drawer).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    await drawer.getByRole('button', CLOSE_MENU).tap();

    await expect(drawer).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should navigate and close the drawer when a drawer link is followed', async ({
    page,
  }) => {
    await page.getByRole('button', OPEN_MENU).tap();

    const drawer = page.getByRole('dialog', DRAWER);
    await drawer.getByRole('link', { name: 'About' }).tap();

    await expect(page).toHaveURL(ROUTES.about);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  });

  test('should open the drawer when the menu button is activated from the keyboard', async ({
    page,
  }) => {
    const menuButton = page.getByRole('button', OPEN_MENU);

    await menuButton.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog', DRAWER)).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  test(
    'should close the drawer and restore focus to the menu button when Escape is pressed',
    {
      annotation: {
        type: 'aria-pattern',
        description:
          'the drawer is a native modal dialog, so the browser owns Escape and focus restoration',
      },
    },
    async ({ page }) => {
      const menuButton = page.getByRole('button', OPEN_MENU);
      const drawer = page.getByRole('dialog', DRAWER);

      await menuButton.focus();
      await page.keyboard.press('Enter');
      await expect(drawer).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(drawer).toBeHidden();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      await expect(menuButton).toBeFocused();
    },
  );

  test('should keep focus inside the drawer while it is open', async ({
    page,
  }) => {
    const drawer = page.getByRole('dialog', DRAWER);

    await page.getByRole('button', OPEN_MENU).focus();
    await page.keyboard.press('Enter');
    await expect(drawer).toBeVisible();

    // A modal dialog takes the whole tab sequence, so cycling past its last
    // control must land back inside it rather than on the page behind.
    const stops = await drawer.getByRole('link').count();
    for (let stop = 0; stop <= stops + 1; stop += 1) {
      await page.keyboard.press('Tab');
    }

    await expect(drawer.locator(':focus')).toHaveCount(1);
  });
});
