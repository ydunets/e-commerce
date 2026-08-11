import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { ROUTES } from './helpers';

const NEWSLETTER_HEADING = 'Join our newsletter';
const COPYRIGHT_PATTERN = new RegExp(
  `© ${new Date().getUTCFullYear()} StyleNest, Inc\\.`,
);
const SOCIAL_LABELS = ['YouTube', 'Instagram', 'Facebook', 'GitHub', 'X'] as const;

const footer = (page: Page) => page.getByRole('contentinfo');

test.describe('Site Footer', () => {
  // Scoped to the one test that blocks scripts on purpose: Chromium logs a
  // resource failure per blocked request, and every other test here must stay
  // strict about console errors.
  test.describe('with scripts blocked', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test('should render the footer and its newsletter form on the server when scripts are blocked', async ({
      page,
    }) => {
      // Block scripts: what remains is exactly what the server sent.
      await page.route('**/*.js', (route) => route.abort());
      await page.goto(ROUTES.home);

      await expect(footer(page).getByText(NEWSLETTER_HEADING)).toBeVisible();
      await expect(footer(page).getByRole('textbox')).toBeVisible();
      await expect(
        footer(page).getByRole('button', { name: 'Subscribe' }),
      ).toBeVisible();
    });
  });

  test('should show the current copyright year and every social link', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    // Independent facts about one static region: reporting them together beats
    // stopping at whichever link happens to be missing first.
    await expect.soft(footer(page).getByText(COPYRIGHT_PATTERN)).toBeVisible();
    for (const label of SOCIAL_LABELS) {
      await expect
        .soft(footer(page).getByRole('link', { name: label, exact: true }))
        .toBeVisible();
    }
  });

  test('should navigate to the products catalog when a footer shop link is followed', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await footer(page).getByRole('link', { name: 'Latest arrivals' }).click();

    await expect(page).toHaveURL(ROUTES.products);
  });
});
