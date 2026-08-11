import { expect, test } from './fixtures';
import { PRODUCT } from './helpers';

const ADD_TO_CART = { name: 'Add to Cart' } as const;

// The project records a trace on the first retry. Starting a second recording
// on top of that one throws, so this spec turns the automatic policy off and
// owns its trace outright.
test.use({ trace: 'off' });

test(
  'should record a trace of the add-to-cart flow when tracing is started explicitly',
  {
    annotation: {
      type: 'purpose',
      description:
        'exercises the Tracing API directly, independent of the retry-driven policy',
    },
  },
  async ({ context, gotoHydrated, page }, testInfo) => {
    await context.tracing.start({
      title: testInfo.title,
      screenshots: true,
      snapshots: true,
    });

    await gotoHydrated(PRODUCT.path);
    await page.getByRole('button', ADD_TO_CART).click();
    await expect(
      page.getByRole('link', { name: /shopping bag/i }),
    ).toHaveCartCount(1);

    const tracePath = testInfo.outputPath('add-to-cart.zip');
    await context.tracing.stop({ path: tracePath });

    await testInfo.attach('add-to-cart-trace', {
      path: tracePath,
      contentType: 'application/zip',
    });
  },
);
