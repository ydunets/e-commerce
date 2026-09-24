import { ACCEPT_COOKIES, COOKIE_BANNER, expect, test } from './fixtures';
import { COOKIE_CHOICE_KEY, PRODUCT, ROUTES } from './helpers';

test.describe('Storefront Surfaces', () => {
  test('should show product specifications without the care sheet or photo picker', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(PRODUCT.path);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Care and materials' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Download specification sheet' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: /reviews/ }).click();
    const dialog = page.getByRole('dialog', {
      name: `Reviews for ${PRODUCT.name}`,
    });
    await expect(
      dialog.getByRole('heading', { name: 'Overall Rating' }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Write a review' }),
    ).toBeVisible();
    await expect(dialog.getByLabel('Add a photo')).toHaveCount(0);
  });

  test('should stack the rating summary above reviews on tablets', async ({
    gotoHydrated,
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoHydrated(PRODUCT.path);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: /reviews/ }).click();
    const dialog = page.getByRole('dialog', {
      name: `Reviews for ${PRODUCT.name}`,
    });
    const writeReview = dialog.getByRole('button', { name: 'Write a review' });
    const firstReview = dialog.getByRole('article').first();
    await expect(writeReview).toBeVisible();
    await expect(firstReview).toBeVisible();
    const buttonBounds = await writeReview.boundingBox();
    const reviewBounds = await firstReview.boundingBox();
    expect(buttonBounds).not.toBeNull();
    expect(reviewBounds).not.toBeNull();
    expect(reviewBounds!.y).toBeGreaterThanOrEqual(
      buttonBounds!.y + buttonBounds!.height,
    );
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test.describe('the cookie banner', () => {
    // The handler that answers the banner elsewhere would race these
    // assertions, so this group meets the banner as a visitor does.
    test.use({ dismissCookieBanner: false });

    test('should stand until it is accepted, then stay away', async ({
      gotoHydrated,
      page,
    }) => {
      await gotoHydrated(ROUTES.home);
      const banner = page.getByRole('region', COOKIE_BANNER);

      await expect(banner).toBeVisible();
      await banner.getByRole('button', ACCEPT_COOKIES).click();
      await expect(banner).toHaveCount(0);

      await gotoHydrated(ROUTES.products);

      await expect(banner).toHaveCount(0);
      expect(
        await page.evaluate(
          (key) => localStorage.getItem(key),
          COOKIE_CHOICE_KEY,
        ),
      ).toBe('accepted');
    });

    test('should be absent from the server-rendered markup, which cannot know the answer', async ({
      request,
    }) => {
      const markup = await (await request.get(ROUTES.home)).text();

      expect(markup).not.toContain(COOKIE_BANNER.name);
    });
  });
});
