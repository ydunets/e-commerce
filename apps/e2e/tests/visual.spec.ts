import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  COOKIE_CHOICE_KEY,
  FIXED_CLOCK,
  SEEDED_CART,
  cartLink,
  PRODUCT,
  ROUTES,
  SEEDED_CART_STATE,
  seedLocalStorage,
} from './helpers';

const SCREENSHOT_STYLESHEET = 'tests/screenshot.css';
const COOKIES_ACCEPTED = 'accepted';

/**
 * Product imagery is served by a remote CDN that re-encodes on its own
 * schedule, so the pixels behind these locators are covered rather than
 * compared.
 */
const maskedImages = (page: Page) => [page.locator('img')];

/**
 * Text antialiasing differs by a handful of pixels between runs on the same
 * machine and by more between machines; a hundredth of the frame absorbs that
 * without hiding a layout shift, which moves whole blocks.
 */
const DIFF_TOLERANCE = { maxDiffPixelRatio: 0.01 };

/** The banner would otherwise cover the page bottom in every capture. */
async function acceptCookiesUpFront(page: Page) {
  await seedLocalStorage(page, COOKIE_CHOICE_KEY, COOKIES_ACCEPTED);
}

/** Web fonts land after hydration and reflow the text they replace. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Rendering Baselines', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookiesUpFront(page);
    await page.clock.setFixedTime(FIXED_CLOCK);
  });

  test('should render the catalogue grid as recorded', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);
    await settle(page);

    await expect(
      page.getByRole('region', { name: 'Products' }),
    ).toHaveScreenshot('catalog-grid.png', {
      mask: maskedImages(page),
      stylePath: SCREENSHOT_STYLESHEET,
      ...DIFF_TOLERANCE,
    });
  });

  test('should render the product page as recorded', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(PRODUCT.path);
    await settle(page);

    await expect(page).toHaveScreenshot('product-page.png', {
      fullPage: true,
      mask: maskedImages(page),
      stylePath: SCREENSHOT_STYLESHEET,
      ...DIFF_TOLERANCE,
    });
  });

  test('should render the home page as recorded', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);
    await settle(page);

    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      mask: maskedImages(page),
      stylePath: SCREENSHOT_STYLESHEET,
      ...DIFF_TOLERANCE,
    });
  });

  test.describe('starting from a seeded cart', () => {
    test.use({ storageState: SEEDED_CART_STATE });

    test('should render the cart page as recorded', async ({
      gotoHydrated,
      page,
    }) => {
      await gotoHydrated(ROUTES.cart);
      await expect(cartLink(page)).toHaveCartCount(SEEDED_CART.quantity);
      await settle(page);
      await expect(page.getByRole('main')).toMatchAriaSnapshot({
        name: 'cart.aria.yml',
      });
      const summary = page.getByRole('region', { name: 'Order Summary' });
      await expect(summary).toMatchAriaSnapshot({
        name: 'order-summary.aria.yml',
      });
      await expect(summary).toHaveScreenshot('order-summary.png', {
        mask: maskedImages(page),
        stylePath: SCREENSHOT_STYLESHEET,
        ...DIFF_TOLERANCE,
      });

      await expect(page).toHaveScreenshot('cart.png', {
        fullPage: true,
        mask: maskedImages(page),
        stylePath: SCREENSHOT_STYLESHEET,
        ...DIFF_TOLERANCE,
      });
    });
    test('should render the checkout page as recorded', async ({
      gotoHydrated,
      page,
    }) => {
      await gotoHydrated(ROUTES.cart);
      await expect(cartLink(page)).toHaveCartCount(SEEDED_CART.quantity);
      await page.getByRole('button', { name: 'Checkout', exact: true }).click();
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(
        page.getByRole('heading', { name: 'Checkout', exact: true }),
      ).toBeVisible();
      await settle(page);
      await expect(page.getByRole('main')).toMatchAriaSnapshot({
        name: 'checkout.aria.yml',
      });
      await expect(page).toHaveScreenshot('checkout.png', {
        fullPage: true,
        mask: maskedImages(page),
        stylePath: SCREENSHOT_STYLESHEET,
        ...DIFF_TOLERANCE,
      });
    });
  });
});

test.describe('Structural Snapshots', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'the desktop navigation is hidden on phones',
  );

  test('should keep the navigation bar, a product card and the footer in shape', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);

    await expect(
      page.getByRole('navigation', { name: 'Main' }),
    ).toMatchAriaSnapshot({ name: 'navbar.aria.yml' });
    await expect(
      page.getByRole('region', { name: 'Products' }).locator('article').first(),
    ).toMatchAriaSnapshot({ name: 'product-card.aria.yml' });
    await expect(page.getByRole('contentinfo')).toMatchAriaSnapshot({
      name: 'footer.aria.yml',
    });
  });
});
