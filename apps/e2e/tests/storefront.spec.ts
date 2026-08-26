import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { PRODUCT } from './helpers';

/**
 * Page margins of the three storefront compositions (Figma 5-6578 Desktop,
 * 5-6592 Tablet, 5-6606 Mobile): a 16px inset around the content column on
 * every breakpoint, plus each section's own padding, which the design sets to
 * 96px on desktop and 16px below it. The collection grid keeps the 12px mobile
 * padding of its own brief, which the mobile composition shows as well.
 */
const BREAKPOINTS = [
  {
    name: 'Desktop',
    viewport: { width: 1440, height: 900 },
    contentLeft: { details: 112, specifications: 112, collection: 112 },
  },
  {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 },
    contentLeft: { details: 32, specifications: 32, collection: 32 },
  },
  {
    name: 'Mobile',
    viewport: { width: 375, height: 812 },
    contentLeft: { details: 32, specifications: 32, collection: 28 },
  },
] as const;

const SPECIFICATIONS_SECTION = { name: 'Product specifications' } as const;
const COLLECTION_SECTION = { name: 'In this collection' } as const;

const sections = (page: Page) => ({
  details: page.getByRole('region', { name: PRODUCT.name }),
  specifications: page.getByRole('region', SPECIFICATIONS_SECTION),
  collection: page.getByRole('region', COLLECTION_SECTION),
});

async function topOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element is not rendered, so it has no box');
  return box.y;
}

/**
 * Where a section's content starts, which is the page margin the composition
 * specifies: the inset of the content column plus the section's own padding.
 */
function contentLeftOf(locator: Locator): Promise<number> {
  return locator.evaluate((section) => {
    const { left } = section.getBoundingClientRect();
    return Math.round(left + Number.parseFloat(getComputedStyle(section).paddingLeft));
  });
}

test.describe('Storefront Page Composition', () => {
  for (const breakpoint of BREAKPOINTS) {
    test.describe(breakpoint.name, () => {
      test.use({ viewport: breakpoint.viewport });

      test(
        'should stack navbar, details, specifications, collection and footer in that order',
        { tag: '@smoke' },
        async ({ gotoHydrated, page }) => {
          await gotoHydrated(PRODUCT.path);
          const { details, specifications, collection } = sections(page);

          const order = [
            page.getByRole('banner'),
            details,
            specifications,
            collection,
            page.getByRole('contentinfo'),
          ];

          const tops: number[] = [];
          for (const section of order) {
            await expect(section).toBeVisible();
            tops.push(await topOf(section));
          }

          expect(tops).toEqual([...tops].sort((a, b) => a - b));
        },
      );

      test(
        'should hold every section to the page margins of the composition',
        { tag: '@smoke' },
        async ({ gotoHydrated, page }) => {
          await gotoHydrated(PRODUCT.path);
          const storefront = sections(page);

          for (const [name, expected] of Object.entries(
            breakpoint.contentLeft,
          )) {
            const section = storefront[name as keyof typeof storefront];
            await expect(section).toBeVisible();
            expect(
              await contentLeftOf(section),
              `the ${name} section starts at the composition's page margin`,
            ).toBe(expected);
          }
        },
      );
    });
  }
});
