import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

// One test aborts the collection request to prove the page stands without the
// section, and Chromium logs that abort as a resource failure.
test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

const COLOR_GREEN = { name: 'Green' } as const;
const COLOR_BROWN = { name: 'Brown' } as const;
const INCREASE = { name: 'Increase quantity' } as const;
const DECREASE = { name: 'Decrease quantity' } as const;
const ADD_TO_CART = { name: 'Add to Cart' } as const;

const INITIAL_QUANTITY = '1';
const INCREMENTED_QUANTITY = '2';

const COLLECTION_SECTION = { name: 'In this collection' } as const;
// The urban collection newest-first, minus Voyager Hoodie itself, capped at
// the design's four cards (see the products seed).
const COLLECTION_SIBLINGS = [
  'Urban Drift Bucket Hat',
  'Metro Hoodie',
  'Azure Attitude Shades',
  'City Quilted Jacket',
] as const;
const SIBLING_PATH = '/products/urban-drift-bucket-hat';
// Seeded facts: metro-hoodie (the section's second card) sells at $81 from a
// $90 list price; PriceTag marks the struck price with "Original price".
const DISCOUNTED_SIBLING = COLLECTION_SIBLINGS[1];
const SIBLING_SALE_PRICE = '$81';
const SIBLING_ORIGINAL_PRICE = 'Original price $90';
// tangerine-mini-tote's fresh collection surfaces classic-canvas-tee, whose
// beige colour is the seed's only fully out-of-stock colour.
const FRESH_PRODUCT_PATH = '/products/tangerine-mini-tote';
const OUT_OF_STOCK_SIBLING = { name: 'Classic Canvas Tee' } as const;
const OUT_OF_STOCK_SWATCH = { name: 'Beige (out of stock)' } as const;
const SPECIFICATIONS_SECTION = { name: 'Product specifications' } as const;

function collectionCard(page: Page, name: string) {
  return page
    .getByRole('region', COLLECTION_SECTION)
    .locator('article')
    .filter({ has: page.getByRole('link', { name }) });
}

test.describe('Product Details', () => {
  test.beforeEach(async ({ gotoHydrated }) => {
    await gotoHydrated(PRODUCT.path);
  });

  test(
    'should render the product with its price and rating from the server',
    { tag: '@smoke' },
    async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: PRODUCT.name }),
      ).toBeVisible();
      await expect(page.getByText('20% OFF')).toBeVisible();
      await expect(page.getByRole('button', { name: /reviews/ })).toBeVisible();
      await expect(page.getByRole('button', ADD_TO_CART)).toBeEnabled();
    },
  );

  test(
    'should update the swatch and the gallery when another colour is selected',
    { tag: '@critical' },
    async ({ page }, testInfo) => {
      const green = page.getByRole('radio', COLOR_GREEN);
      const brown = page.getByRole('radio', COLOR_BROWN);
      const mainImage = page.getByRole('img', { name: PRODUCT.name });
      // Seeded data: green has several images (thumbnails shown), brown has one
      // (the gallery collapses to just the main image).
      const thumbnails = page.getByRole('button', { name: /View image/ });

      await test.step('the default colour offers its thumbnails', async () => {
        await expect(green).toBeChecked();
        await expect(thumbnails.first()).toBeVisible();
      });

      await test.step('a single-image colour collapses the gallery', async () => {
        await brown.click();

        // Gathered before the assertions so a failure carries its evidence.
        await testInfo.attach('gallery-after-switch.json', {
          body: JSON.stringify(
            {
              mainImage: await mainImage.getAttribute('src'),
              thumbnails: await thumbnails.count(),
            },
            null,
            2,
          ),
          contentType: 'application/json',
        });

        await expect(brown).toBeChecked();
        await expect(green).not.toBeChecked();
        await expect(mainImage).toBeVisible();
        await expect(thumbnails).toHaveCount(0);
      });

      await test.step('switching back restores the thumbnails', async () => {
        await green.click();

        await expect(green).toBeChecked();
        await expect(thumbnails.first()).toBeVisible();
      });
    },
  );

  test('should list the collection siblings and never the current product in "In this collection"', async ({
    page,
  }, testInfo) => {
    const section = page.getByRole('region', COLLECTION_SECTION);
    const cards = section.locator('ul').getByRole('link');

    const rendered = await cards.evaluateAll((links) =>
      links.map((link) => link.getAttribute('aria-label') ?? link.textContent),
    );
    await testInfo.attach('collection-cards.json', {
      body: JSON.stringify(rendered, null, 2),
      contentType: 'application/json',
    });

    await expect(cards).toHaveCount(COLLECTION_SIBLINGS.length);
    for (const [index, name] of COLLECTION_SIBLINGS.entries()) {
      await expect(cards.nth(index)).toHaveAccessibleName(name);
    }
    await expect(section.getByRole('link', { name: PRODUCT.name })).toHaveCount(0);
  });

  test('should show the sale price with the original struck through on a discounted collection card', async ({
    page,
  }) => {
    const card = collectionCard(page, DISCOUNTED_SIBLING);

    await expect(card).toContainText(SIBLING_SALE_PRICE);
    await expect(card.getByText(SIBLING_ORIGINAL_PRICE)).toBeVisible();
  });

  test(
    'should cross out a colour on a collection card when that colour is fully out of stock',
    {
      annotation: {
        type: 'seeded-data',
        description:
          "tangerine-mini-tote's collection surfaces classic-canvas-tee, whose beige colour is the seed's only fully out-of-stock colour",
      },
    },
    async ({ gotoHydrated, page }) => {
      await gotoHydrated(FRESH_PRODUCT_PATH);

      const card = collectionCard(page, OUT_OF_STOCK_SIBLING.name);

      await expect(card.getByRole('radio', OUT_OF_STOCK_SWATCH)).toBeVisible();
    },
  );

  test(
    'should render the page without the collection section when the collection request fails',
    {
      annotation: {
        type: 'edge-case',
        description:
          'the collection request is aborted, so the section must be absent rather than broken',
      },
    },
    async ({ gotoHydrated, page }) => {
      await page.route(
        (url) =>
          url.pathname.endsWith('/v1/products') &&
          url.searchParams.has('collection'),
        (route) => route.abort(),
      );
      await gotoHydrated(ROUTES.home);
      await page.getByRole('link', { name: PRODUCT.name }).click();

      await expect(
        page.getByRole('heading', { name: PRODUCT.name }),
      ).toBeVisible();
      await expect(
        page.getByRole('region', SPECIFICATIONS_SECTION),
      ).toBeVisible();
      await expect(page.getByRole('region', COLLECTION_SECTION)).toHaveCount(0);
    },
  );

  test('should navigate to the sibling product page when a collection card is clicked', async ({
    page,
  }) => {
    await page
      .getByRole('region', COLLECTION_SECTION)
      .getByRole('link', { name: COLLECTION_SIBLINGS[0] })
      .click();

    await expect(page).toHaveURL(SIBLING_PATH);
    await expect(
      page.getByRole('heading', { name: COLLECTION_SIBLINGS[0] }),
    ).toBeVisible();
  });

  test('should increment the quantity and keep the decrement disabled at the minimum', async ({
    page,
  }) => {
    const increase = page.getByRole('button', INCREASE);
    const decrease = page.getByRole('button', DECREASE);
    const quantity = page.locator('[aria-live="polite"]');

    await expect(quantity).toHaveText(INITIAL_QUANTITY);
    await expect(decrease).toBeDisabled();

    await increase.click();

    await expect(quantity).toHaveText(INCREMENTED_QUANTITY);
    await expect(decrease).toBeEnabled();
  });
});
