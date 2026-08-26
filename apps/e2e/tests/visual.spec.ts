import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { COOKIE_CHOICE_KEY, PRODUCT, ROUTES } from './helpers';

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
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [COOKIE_CHOICE_KEY, COOKIES_ACCEPTED],
  );
}

/** Web fonts land after hydration and reflow the text they replace. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Rendering Baselines', () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookiesUpFront(page);
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
});

test.describe('Structural Snapshots', () => {
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
