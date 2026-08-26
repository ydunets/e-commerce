import { expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

const SPECIFICATIONS_TAB = { name: 'Comfort' } as const;
const REDUCED_MOTION_MS = 0.01;

/** The shop ships one palette; the page background states it. */
const PAGE_BACKGROUND = 'rgb(255, 255, 255)';

const bodyBackground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('Media Emulation', () => {
  test(
    'should keep its one palette when the visitor prefers a dark colour scheme',
    {
      annotation: {
        type: 'known-issue',
        description:
          'the design ships no dark theme, so the claim is that the light palette holds rather than that a dark one appears',
      },
    },
    async ({ gotoHydrated, page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await gotoHydrated(ROUTES.home);
      expect(await bodyBackground(page)).toBe(PAGE_BACKGROUND);

      await page.emulateMedia({ colorScheme: 'dark' });

      expect(await bodyBackground(page)).toBe(PAGE_BACKGROUND);
    },
  );

  test('should drop the panel animation when the visitor prefers reduced motion', async ({
    gotoHydrated,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(PRODUCT.path);

    // Switching tabs is what starts the specifications panel's fade.
    await page.getByRole('tab', SPECIFICATIONS_TAB).click();

    const duration = await page
      .getByRole('tabpanel')
      .first()
      .evaluate((panel) =>
        Number.parseFloat(getComputedStyle(panel).animationDuration),
      );
    expect(duration * 1000).toBeLessThanOrEqual(REDUCED_MOTION_MS * 1000);
  });

  test('should leave the screen-only chrome out of a printed page', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(PRODUCT.path);
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible();

    await page.emulateMedia({ media: 'print' });

    await expect(navbar).toBeHidden();
    await expect(
      page.getByRole('heading', { name: PRODUCT.name }),
    ).toBeVisible();
  });
});
