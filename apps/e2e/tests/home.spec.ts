import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { API_PREFIX, ROUTES } from './helpers';

const HERO_HEADING = { name: 'Discover the StyleNest collection' } as const;
const SHOP_LINK = { name: 'Shop now' } as const;
const MAIN_NAV = { name: 'Main' } as const;

test.describe('Storefront Home', () => {
  // Only this test provokes resource-failure noise; the rest stay strict.
  test.describe('with scripts blocked', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test('should render the hero on the server when scripts are blocked', async ({
      page,
    }) => {
      await page.route('**/*.js', (route) => route.abort());
      await page.goto(ROUTES.home);

      await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();
      await expect(page.getByRole('link', SHOP_LINK)).toBeVisible();
      // No grid in the server-rendered markup means no product fetch behind it.
      await expect(page.getByRole('article')).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Latest Arrivals' }),
      ).toHaveCount(0);
    });
  });

  // Listings live on the catalog route alone (#41), so the home page holds no
  // product grid and issues no product request of its own.
  test('should present the hero alone, without a product listing', async ({
    gotoHydrated,
    page,
  }) => {
    const productRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(`${API_PREFIX}/products`)) {
        productRequests.push(request.url());
      }
    });

    await gotoHydrated(ROUTES.home);

    await expect(page.getByRole('heading', HERO_HEADING)).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    expect(productRequests).toEqual([]);
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
