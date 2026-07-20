import { expect, type Page, test } from '@playwright/test';
import { gotoHydrated, PRODUCT, ROUTES } from './helpers';

const HERO_HEADING = { name: 'Discover the StyleNest collection' } as const;
const SHOP_LINK = { name: `Shop the ${PRODUCT.name}` } as const;
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

test('renders the server-side markup before any JS runs', async ({ page }) => {
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

test('shows the 8 newest products in order in Latest Arrivals', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);

  const cards = latestArrivals(page).getByRole('link');
  await expect(cards).toHaveCount(LATEST_ARRIVALS.length);
  for (const [index, name] of LATEST_ARRIVALS.entries()) {
    await expect(cards.nth(index)).toHaveAccessibleName(name);
  }
});

test('shows the default colour variant with its card price on a card', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);

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
test('clicking a swatch swaps the card to that colour variant', async ({
  page,
}) => {
  await gotoHydrated(page, ROUTES.home);

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

test('opens the product details page from a card', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await latestArrivals(page)
    .getByRole('link', { name: PRODUCT.name })
    .click();

  await expect(page).toHaveURL(PRODUCT.path);
  await expect(
    page.getByRole('heading', { name: PRODUCT.name }),
  ).toBeVisible();
});

test('shows the hero and the desktop navigation', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();

  const nav = page.getByRole('navigation', MAIN_NAV);
  await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Products' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
});

test('navigates to the product page from the hero link', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await page.getByRole('link', SHOP_LINK).click();

  await expect(page).toHaveURL(PRODUCT.path);
  await expect(
    page.getByRole('heading', { name: PRODUCT.name }),
  ).toBeVisible();
});

test('about page reports a live API connection', async ({ page }) => {
  await gotoHydrated(page, ROUTES.about);

  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  // ServerStatus fetches client-side through the /api proxy.
  await expect(page.getByText(/Connected — server reports/)).toBeVisible();
});
