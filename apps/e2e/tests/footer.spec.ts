import { expect, type Page, test } from '@playwright/test';
import { gotoHydrated, ROUTES } from './helpers';

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

test('shows the copyright year and every social link', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await expect(footer(page).getByText(COPYRIGHT_PATTERN)).toBeVisible();
  for (const label of SOCIAL_LABELS) {
    await expect(
      footer(page).getByRole('link', { name: label, exact: true }),
    ).toBeVisible();
  }
});

test('a shop link navigates to the products catalog', async ({ page }) => {
  await gotoHydrated(page, ROUTES.home);

  await footer(page).getByRole('link', { name: 'Latest arrivals' }).click();

  await expect(page).toHaveURL(ROUTES.products);
});
