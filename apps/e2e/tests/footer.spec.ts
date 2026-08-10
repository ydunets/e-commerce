import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { ROUTES } from './helpers';

// The first test blocks every script to inspect the server-rendered markup,
// and Chromium logs a resource failure for each blocked request.
test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

const NEWSLETTER_HEADING = 'Join our newsletter';
const COPYRIGHT_PATTERN = new RegExp(
  `© ${new Date().getUTCFullYear()} StyleNest, Inc\\.`,
);
const SOCIAL_LABELS = ['YouTube', 'Instagram', 'Facebook', 'GitHub', 'X'] as const;

const footer = (page: Page) => page.getByRole('contentinfo');

test('server-renders the footer with the newsletter form before any JS runs', async ({
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

test('shows the copyright year and every social link', async ({
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

test('a shop link navigates to the products catalog', async ({
  gotoHydrated,
  page,
}) => {
  await gotoHydrated(ROUTES.home);

  await footer(page).getByRole('link', { name: 'Latest arrivals' }).click();

  await expect(page).toHaveURL(ROUTES.products);
});
