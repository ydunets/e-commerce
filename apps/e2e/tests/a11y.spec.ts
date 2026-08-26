import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

/**
 * The standard the shop is held to. Best-practice rules are left out: they
 * carry opinions, not conformance failures.
 */
const STANDARD_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Violations each route is allowed to carry, so a known gap does not block a
 * run while a new one does. Every non-zero budget names what it tolerates.
 */
const ROUTE_BUDGETS = [
  { name: 'home', path: ROUTES.home, budget: 0 },
  { name: 'catalogue', path: ROUTES.products, budget: 0 },
  { name: 'product', path: PRODUCT.path, budget: 0 },
] as const;

for (const route of ROUTE_BUDGETS) {
  test(`should stay within the accessibility budget on the ${route.name} route`, async ({
    gotoHydrated,
    page,
  }, testInfo) => {
    await gotoHydrated(route.path);

    const { violations } = await new AxeBuilder({ page })
      .withTags(STANDARD_TAGS)
      .analyze();

    // Attached before the assertion so a failure carries its evidence.
    await testInfo.attach(`axe-${route.name}.json`, {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });

    expect(
      violations.map((violation) => `${violation.id}: ${violation.help}`),
      `the ${route.name} route may carry at most ${route.budget} violations`,
    ).toHaveLength(route.budget);
  });
}
