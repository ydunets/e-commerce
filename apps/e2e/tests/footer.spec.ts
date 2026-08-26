import type { Page } from '@playwright/test';
import { BLOCKED_REQUEST_NOISE, expect, test } from './fixtures';
import { FIXED_CLOCK, ROUTES } from './helpers';

const NEWSLETTER_HEADING = 'Join our newsletter';
const COPYRIGHT_PATTERN = /© (\d{4}) StyleNest, Inc\./;
const SOCIAL_LABELS = ['YouTube', 'Instagram', 'Facebook', 'GitHub', 'X'] as const;

const footer = (page: Page) => page.getByRole('contentinfo');

test.describe('Site Footer', () => {
  // Only this test provokes resource-failure noise; the rest stay strict.
  test.describe('with scripts blocked', () => {
    test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });

    test('should render the footer and its newsletter form on the server when scripts are blocked', async ({
      page,
    }) => {
      await page.route('**/*.js', (route) => route.abort());
      await page.goto(ROUTES.home);

      await expect(footer(page).getByText(NEWSLETTER_HEADING)).toBeVisible();
      await expect(footer(page).getByRole('textbox')).toBeVisible();
      await expect(
        footer(page).getByRole('button', { name: 'Subscribe' }),
      ).toBeVisible();
    });
  });

  test('should show every social link', async ({ gotoHydrated, page }) => {
    await gotoHydrated(ROUTES.home);

    for (const label of SOCIAL_LABELS) {
      await expect
        .soft(footer(page).getByRole('link', { name: label, exact: true }))
        .toBeVisible();
    }
  });

  test(
    'should keep the server-rendered copyright year under a browser clock in another year',
    {
      annotation: {
        type: 'determinism',
        description:
          'the year is read from whichever clock renders it, so the assertion compares the page against the server that rendered it rather than against wall time',
      },
    },
    async ({ gotoHydrated, page, request }) => {
      // React separates adjacent server-rendered text nodes with empty
      // comments, which the rendered page does not show.
      const markup = (await (await request.get(ROUTES.home)).text()).replaceAll(
        '<!-- -->',
        '',
      );
      const serverYear = markup.match(COPYRIGHT_PATTERN)?.[1];
      expect(serverYear, 'the server renders the copyright year').toMatch(
        /^\d{4}$/,
      );

      await page.clock.setFixedTime(FIXED_CLOCK);
      await gotoHydrated(ROUTES.home);

      // The error guard is the other half of this claim: a client year that
      // disagreed with the server's would tear the tree on hydration.
      await expect(
        footer(page).getByText(`© ${serverYear} StyleNest, Inc.`),
      ).toBeVisible();
    },
  );

  test('should navigate to the products catalog when a footer shop link is followed', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(ROUTES.home);

    await footer(page).getByRole('link', { name: 'Latest arrivals' }).click();

    await expect(page).toHaveURL(ROUTES.products);
  });
});
