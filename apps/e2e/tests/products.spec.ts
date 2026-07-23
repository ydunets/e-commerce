import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT, ROUTES } from './helpers';

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

test('renders every seeded product newest-first before any JS runs', async ({
  page,
}) => {
  // Block scripts: what remains is exactly what the server sent.
  await page.route('**/*.js', (route) => route.abort());
  await page.goto(ROUTES.products);

  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

  // Scope to the grid's <ul>, excluding the navbar's links.
  const cards = page
    .getByRole('region', { name: 'Products' })
    .locator('ul')
    .getByRole('link');
  await expect(cards).toHaveCount(ALL_PRODUCTS.length);
  for (const [index, name] of ALL_PRODUCTS.entries()) {
    await expect(cards.nth(index)).toHaveAccessibleName(name);
  }
});

test('has a StyleNest document title', async ({ page }) => {
  await gotoHydrated(page, ROUTES.products);

  await expect(page).toHaveTitle(/StyleNest/);
});

test('"View all" navigates from the home Latest Arrivals section', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);

  await page
    .getByRole('region', { name: 'Latest Arrivals' })
    .getByRole('link', { name: 'View all' })
    .click();

  await expect(page).toHaveURL(ROUTES.products);
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
});

test('the hero "Shop now" CTA navigates to the catalog', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await page.getByRole('link', { name: 'Shop now' }).click();

  await expect(page).toHaveURL(ROUTES.products);
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
});

test('a card click reaches the product details page', async ({ page }) => {
  await gotoHydrated(page, ROUTES.products);

  await page.getByRole('link', { name: PRODUCT.name }).click();

  await expect(page).toHaveURL(PRODUCT.path);
  await expect(
    page.getByRole('heading', { name: PRODUCT.name }),
  ).toBeVisible();
});
