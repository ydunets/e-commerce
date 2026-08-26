import type { Page } from '@playwright/test';
import { ACCEPT_COOKIES, expect, test } from './fixtures';
import { cartLink, PRODUCT } from './helpers';

const COLOUR_BROWN = { name: 'Brown' } as const;
const ADD_TO_CART = { name: 'Add to Cart' } as const;
// Far enough to leave the product images behind, short enough to stay on the page.
const SWIPE_DISTANCE = 400;

/**
 * A real one-finger scroll. The touchscreen API is a press and a release with
 * nothing in between, and dispatched touch events never reach the compositor,
 * so the gesture is synthesised through the Chromium protocol the mobile
 * project already runs on.
 */
async function swipeUp(page: Page, distance: number) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('the mobile project runs with a viewport');

  const session = await page.context().newCDPSession(page);
  await session.send('Input.synthesizeScrollGesture', {
    x: Math.round(viewport.width / 2),
    y: Math.round(viewport.height / 2),
    yDistance: -distance,
    gestureSourceType: 'touch',
  });
  await session.detach();
}

test.describe('Mobile Gestures', () => {
  test.beforeEach(async ({ gotoHydrated }) => {
    await gotoHydrated(PRODUCT.path);
  });

  // The handler that answers the banner elsewhere would answer it before the
  // tap lands, so this test meets the banner as a visitor does.
  test.describe('the cookie banner', () => {
    test.use({ dismissCookieBanner: false });

    test('should answer the cookie banner with a tap', async ({ page }) => {
      await page.getByRole('button', ACCEPT_COOKIES).tap();

      await expect(page.getByRole('button', ACCEPT_COOKIES)).toHaveCount(0);
    });
  });

  test('should select a colour and add the item to the bag by tapping', async ({
    page,
  }) => {
    await expect(cartLink(page)).toHaveCartCount(0);

    await page.getByRole('radio', COLOUR_BROWN).tap();
    await expect(page.getByRole('radio', COLOUR_BROWN)).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.getByRole('button', ADD_TO_CART).tap();

    await expect(cartLink(page)).toHaveCartCount(1);
  });

  test('should scroll the specifications into view on a swipe', async ({
    page,
  }) => {
    const specifications = page.getByRole('region', {
      name: 'Product specifications',
    });
    const scrolled = () => page.evaluate(() => window.scrollY);
    expect(await scrolled()).toBe(0);

    await swipeUp(page, SWIPE_DISTANCE);

    await expect.poll(scrolled).toBeGreaterThan(0);
    await specifications.scrollIntoViewIfNeeded();
    await expect(specifications).toBeVisible();
  });
});
