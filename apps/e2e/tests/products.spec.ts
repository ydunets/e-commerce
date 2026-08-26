import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

// All 19 seeded products, newest-first by created_at (see products seed).
const ALL_PRODUCTS = [
  'Urban Drift Bucket Hat',
  'Tangerine Mini Tote',
  'Elemental Sneakers',
  'Metro Hoodie',
  'Sunbeam Mules',
  'Azure Attitude Shades',
  'Voyager Hoodie',
  'LA Baseball Hat',
  'Classic Canvas Tee',
  'Cool Neo-Retro Shoes',
  'City Quilted Jacket',
  'Autumnal Knitwear',
  'StepSoft Socks',
  'Color Ease Tee',
  'Harvest Cozy Turtleneck',
  'Neutral Charm Blazer',
  'Cute Banana Socks',
  'Canis Philosophus Linen Tee',
  'Urban Bomber Jacket',
] as const;

const catalog = (page: Page) => page.getByRole('region', { name: 'Products' });

test.describe('Product Catalog', () => {
  // Only this test provokes resource-failure noise; the rest stay strict.
  test.describe('with scripts blocked', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test('should render every product newest-first on the server when scripts are blocked', async ({
      page,
    }) => {
      await page.route('**/*.js', (route) => route.abort());
      await page.goto(ROUTES.products);

      await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

      // Scope to the grid's <ul>, excluding the navbar's links.
      const cards = catalog(page).locator('ul').getByRole('link');
      await expect(cards).toHaveCount(ALL_PRODUCTS.length);
      for (const [index, name] of ALL_PRODUCTS.entries()) {
        await expect(cards.nth(index)).toHaveAccessibleName(name);
      }
    });
  });

  test('should carry the StyleNest document title', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);

    await expect(page).toHaveTitle(/StyleNest/);
  });

  test('should reach the catalog when the hero "Shop now" call to action is followed', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await page.getByRole('link', { name: 'Shop now' }).click();

    await expect(page).toHaveURL(ROUTES.products);
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('should show the default colour variant with its sale and list price on a card', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);

    // Seeded facts: voyager-hoodie's first inventory colour is green, on sale
    // at $76 from a $95 list price.
    const voyagerCard = catalog(page).getByRole('link', { name: PRODUCT.name });
    await expect(voyagerCard).toContainText('Green');
    await expect(voyagerCard).toContainText('$76');
    await expect(voyagerCard).toContainText('$95');
  });

  test('should swap the card to another colour variant when its swatch is clicked, without navigating', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);

    // Seeded facts: urban-drift-bucket-hat comes in black (default) and white,
    // with a different catalog image per colour.
    const card = page
      .locator('article')
      .filter({ has: page.getByRole('link', { name: ALL_PRODUCTS[0] }) });
    const image = card.getByRole('link').locator('img');
    await expect(card).toContainText('Black');
    const defaultImageSrc = await image.getAttribute('src');
    expect(defaultImageSrc).toBeTruthy();

    const whiteSwatch = card.getByRole('radio', { name: /White/ });
    await whiteSwatch.click();

    await expect(whiteSwatch).toHaveAttribute('aria-checked', 'true');
    await expect(card).toContainText('White');
    await expect(image).not.toHaveAttribute('src', defaultImageSrc ?? '');
    // Selection is local card state: no navigation, no URL change.
    await expect(page).toHaveURL(ROUTES.products);
  });

  test('should open the product details page when a catalog card is clicked', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.products);

    await page.getByRole('link', { name: PRODUCT.name }).click();

    await expect(page).toHaveURL(PRODUCT.path);
    await expect(
      page.getByRole('heading', { name: PRODUCT.name }),
    ).toBeVisible();
  });
});
