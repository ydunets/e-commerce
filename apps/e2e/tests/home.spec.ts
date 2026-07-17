import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT, ROUTES } from './helpers';

const HERO_HEADING = { name: 'Discover the StyleNest collection' } as const;
const SHOP_LINK = { name: `Shop the ${PRODUCT.name}` } as const;
const MAIN_NAV = { name: 'Main' } as const;

test('renders the server-side markup before any JS runs', async ({ page }) => {
  // Block scripts: what remains is exactly what the server sent.
  await page.route('**/*.js', (route) => route.abort());
  await page.goto(ROUTES.home);

  await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();
  await expect(page.getByRole('link', SHOP_LINK)).toBeVisible();
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
