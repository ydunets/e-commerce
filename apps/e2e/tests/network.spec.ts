import type { Page, Route } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { API_PREFIX, NEWSLETTER, ROUTES, uniqueEmail } from './helpers';

/**
 * Catalogue listing as the browser requests it. Only client-side navigations
 * reach these handlers: a cold load renders on the server, where the request
 * never passes through the browser at all.
 */
const LISTING_ROUTE = `**${API_PREFIX}/products*`;

/**
 * Recorded once and replayed since. Refresh it with
 * `RECORD_HAR=1 pnpm --filter @e-commerce/e2e test tests/network.spec.ts`
 * against a running stack, which rewrites the file from live responses.
 */
const CATALOG_HAR = 'tests/fixtures/catalog.har';
const RECORDING = Boolean(process.env.RECORD_HAR);

// All 19 seeded products; the cap is any number the catalogue cannot reach on
// its own, so a capped listing is unmistakable.
const SEEDED_PRODUCT_COUNT = 19;
const CAPPED_LIMIT = 3;

const catalogCards = (page: Page) =>
  page.getByRole('region', { name: 'Products' }).locator('ul').getByRole('link');

/** Follows the catalogue link, which runs the listing request in the browser. */
async function navigateToCatalog(page: Page) {
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Products' })
    .click();
  await expect(page).toHaveURL(ROUTES.products);
}

test.describe('Network Control', () => {
  test(
    'should serve the catalogue listing from the recorded exchange',
    {
      annotation: {
        type: 'determinism',
        description:
          'the listing is replayed from a HAR, so the assertion no longer depends on what the API answers today',
      },
    },
    async ({ gotoHydrated, page }) => {
      await page.routeFromHAR(CATALOG_HAR, {
        url: LISTING_ROUTE,
        update: RECORDING,
        // One readable file rather than a HAR plus hashed body attachments.
        updateContent: 'embed',
        // An exchange missing from the recording must fail loudly rather than
        // fall through to the live API and hide the gap.
        notFound: 'abort',
      });

      await gotoHydrated(ROUTES.home);
      await navigateToCatalog(page);

      await expect(catalogCards(page)).toHaveCount(SEEDED_PRODUCT_COUNT);
    },
  );

  test(
    'should render the modified listing, then the live one once the route is removed',
    {
      annotation: {
        type: 'network',
        description:
          'the request is continued with a rewritten query, and the handler is removed explicitly before the live listing is asserted',
      },
    },
    async ({ gotoHydrated, page }) => {
      const capListing = (route: Route) => {
        const url = new URL(route.request().url());
        url.searchParams.set('limit', String(CAPPED_LIMIT));
        return route.continue({ url: url.toString() });
      };
      await page.route(LISTING_ROUTE, capListing);

      await gotoHydrated(ROUTES.home);
      await navigateToCatalog(page);
      await expect(catalogCards(page)).toHaveCount(CAPPED_LIMIT);

      await page.unroute(LISTING_ROUTE, capListing);

      // Leaving the route and returning re-runs the loader, which now reaches
      // the API untouched.
      await page.getByRole('link', { name: 'Home' }).first().click();
      await navigateToCatalog(page);
      await expect(catalogCards(page)).toHaveCount(SEEDED_PRODUCT_COUNT);
    },
  );

  // An offline browser fails every request it makes, which Chromium reports.
  test.describe('while the browser is offline', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test(
      'should report a failed subscription rather than hanging',
      {
        annotation: {
          type: 'network',
          description:
            'the whole context goes offline, so the form meets a transport failure rather than an error status',
        },
      },
      async ({ context, gotoHydrated, page }) => {
        await gotoHydrated(ROUTES.home);
        const field = page.getByRole('textbox', NEWSLETTER.field);
        const subscribe = page.getByRole('button', NEWSLETTER.submit);

        await context.setOffline(true);
        await field.fill(uniqueEmail());
        await subscribe.click();

        await expect(page.getByRole('status')).toHaveText(NEWSLETTER.failure);
        await expect(subscribe).toBeEnabled();

        await context.setOffline(false);
        await field.fill(uniqueEmail());
        await subscribe.click();

        await expect(page.getByRole('status')).toHaveText(NEWSLETTER.success);
      },
    );
  });
});
