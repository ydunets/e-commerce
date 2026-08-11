import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

// The first test blocks every script to inspect the server-rendered markup,
// and Chromium logs a resource failure for each blocked request.
test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

const HERO_HEADING = { name: 'Discover the StyleNest collection' } as const;
const SHOP_LINK = { name: 'Shop now' } as const;
const MAIN_NAV = { name: 'Main' } as const;

// The 8 newest seeded products by created_at DESC (see products seed).
const LATEST_ARRIVALS = [
  'Urban Drift Bucket Hat',
  'Tangerine Mini Tote',
  'Elemental Sneakers',
  'Metro Hoodie',
  'Sunbeam Mules',
  'Azure Attitude Shades',
  'Voyager Hoodie',
  'LA Baseball Hat',
] as const;

const latestArrivals = (page: Page) =>
  page.getByRole('region', { name: 'Latest Arrivals' });

test.describe('Storefront Home', () => {
  test('should render the hero and Latest Arrivals on the server when scripts are blocked', async ({
    page,
  }) => {
    // Block scripts: what remains is exactly what the server sent.
    await page.route('**/*.js', (route) => route.abort());
    await page.goto(ROUTES.home);

    await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();
    await expect(page.getByRole('link', SHOP_LINK)).toBeVisible();
    // Latest Arrivals arrives server-rendered too, with the product data
    // already in the HTML.
    await expect(
      page.getByRole('heading', { name: 'Latest Arrivals' }),
    ).toBeVisible();
    await expect(
      latestArrivals(page).getByRole('link', { name: LATEST_ARRIVALS[0] }),
    ).toBeVisible();
  });

  test('should list the eight newest products in order in Latest Arrivals', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await expect(
      latestArrivals(page).getByRole('link', { name: 'View all' }),
    ).toBeVisible();

    // Cards live in the section's <ul>, separate from the "View all" action.
    const cards = latestArrivals(page).locator('ul').getByRole('link');
    await expect(cards).toHaveCount(LATEST_ARRIVALS.length);
    for (const [index, name] of LATEST_ARRIVALS.entries()) {
      await expect(cards.nth(index)).toHaveAccessibleName(name);
    }
  });

  test('should show the default colour variant with its sale and list price on a card', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    // Seeded facts: voyager-hoodie's first inventory colour is green, on sale
    // at $76 from a $95 list price.
    const voyagerCard = latestArrivals(page).getByRole('link', {
      name: PRODUCT.name,
    });
    await expect(voyagerCard).toContainText('Green');
    await expect(voyagerCard).toContainText('$76');
    await expect(voyagerCard).toContainText('$95');
  });

  // The crossed out-of-stock swatch cannot be asserted here: the only fully
  // out-of-stock seeded colour (classic-canvas-tee beige) is the 9th-newest
  // product, outside the home grid. The /products spec (#22) covers it; the
  // ColorSwatches stories exercise the state interactively meanwhile.
  test('should swap the card to another colour variant when its swatch is clicked, without navigating', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    // Seeded facts: urban-drift-bucket-hat comes in black (default) and white,
    // with a different catalog image per colour.
    const card = page
      .locator('article')
      .filter({ has: page.getByRole('link', { name: LATEST_ARRIVALS[0] }) });
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
    await expect(page).toHaveURL(ROUTES.home);
  });

  test('should open the product details page when a card is clicked', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await latestArrivals(page)
      .getByRole('link', { name: PRODUCT.name })
      .click();

    await expect(page).toHaveURL(PRODUCT.path);
    await expect(
      page.getByRole('heading', { name: PRODUCT.name }),
    ).toBeVisible();
  });

  test('should offer the desktop navigation and reach the catalog from it', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();

    const nav = page.getByRole('navigation', MAIN_NAV);
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();

    const productsLink = nav.getByRole('link', { name: 'Products' });
    await expect(productsLink).toBeVisible();
    await productsLink.click();
    await expect(page).toHaveURL(ROUTES.products);
  });

  test('should navigate to the products catalog when the hero link is followed', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await page.getByRole('link', SHOP_LINK).click();

    await expect(page).toHaveURL(ROUTES.products);
  });

  test('should report a live API connection on the about page', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.about);

    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    // ServerStatus fetches client-side through the /api proxy.
    await expect(page.getByText(/Connected — server reports/)).toBeVisible();
  });
});
