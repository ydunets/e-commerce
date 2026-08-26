import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { PRODUCT, ROUTES } from './helpers';

// Seeded data: classic-canvas-tee carries five colours and five sizes, the
// widest groups in the catalog, so wrapping and the Home and End keys have
// somewhere to go.
const MULTI_OPTION_PRODUCT_PATH = '/products/classic-canvas-tee';
const COLOUR_GROUP = { name: 'Available colors' } as const;
const SIZE_GROUP = { name: 'Available sizes' } as const;
const CHECKED_OPTION = '[role="radio"][aria-checked="true"]';

const colourGroup = (page: Page) => page.getByRole('radiogroup', COLOUR_GROUP);
const sizeGroup = (page: Page) => page.getByRole('radiogroup', SIZE_GROUP);

/** The accessible name of whichever option is currently checked. */
async function checkedOption(group: Locator): Promise<string | null> {
  return group.locator(CHECKED_OPTION).evaluate(
    (option) => option.getAttribute('aria-label') ?? option.textContent,
  );
}

/** Accessible names of every option in the group, in render order. */
function optionNames(group: Locator): Promise<(string | null)[]> {
  return group
    .getByRole('radio')
    .evaluateAll((options) =>
      options.map(
        (option) => option.getAttribute('aria-label') ?? option.textContent,
      ),
    );
}

test.describe('Keyboard Navigation', () => {
  test.describe('the colour swatch group', () => {
    test.beforeEach(async ({ gotoHydrated }) => {
      await gotoHydrated(MULTI_OPTION_PRODUCT_PATH);
    });

    test(
      'should expose only the checked swatch to the tab sequence',
      {
        annotation: {
          type: 'aria-pattern',
          description:
            'a radiogroup takes one tab stop, then arrow keys move within it',
        },
      },
      async ({ page }) => {
        const group = colourGroup(page);

        await expect(group.getByRole('radio')).not.toHaveCount(1);
        await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(
          1,
        );
        await expect(
          group.locator(`${CHECKED_OPTION}[tabindex="0"]`),
        ).toHaveCount(1);
      },
    );

    test('should move the selection forward when ArrowRight is pressed', async ({
      page,
    }) => {
      const group = colourGroup(page);
      const [first, second] = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      expect(await checkedOption(group)).toBe(first);

      await page.keyboard.press('ArrowRight');

      expect(await checkedOption(group)).toBe(second);
      await expect(group.locator(CHECKED_OPTION)).toBeFocused();
    });

    test('should move the selection backward when ArrowLeft is pressed', async ({
      page,
    }) => {
      const group = colourGroup(page);
      const [first, second] = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('ArrowDown');
      expect(await checkedOption(group)).toBe(second);

      await page.keyboard.press('ArrowUp');

      expect(await checkedOption(group)).toBe(first);
    });

    test('should wrap to the first colour when ArrowRight passes the last', async ({
      page,
    }) => {
      const group = colourGroup(page);
      const names = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('End');
      expect(await checkedOption(group)).toBe(names.at(-1));

      await page.keyboard.press('ArrowRight');

      expect(await checkedOption(group)).toBe(names[0]);
    });

    test('should jump to the last colour on End and the first on Home', async ({
      page,
    }) => {
      const group = colourGroup(page);
      const names = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('End');

      expect(await checkedOption(group)).toBe(names.at(-1));

      await page.keyboard.press('Home');

      expect(await checkedOption(group)).toBe(names[0]);
    });
  });

  test.describe('the size group', () => {
    test.beforeEach(async ({ gotoHydrated }) => {
      await gotoHydrated(MULTI_OPTION_PRODUCT_PATH);
    });

    test('should expose only the checked size to the tab sequence', async ({
      page,
    }) => {
      const group = sizeGroup(page);

      await expect(group.getByRole('radio')).not.toHaveCount(1);
      await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
      await expect(group.locator(`${CHECKED_OPTION}[tabindex="0"]`)).toHaveCount(
        1,
      );
    });

    test('should move the selection forward when ArrowRight is pressed', async ({
      page,
    }) => {
      const group = sizeGroup(page);
      const [first, second] = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      expect(await checkedOption(group)).toBe(first);

      await page.keyboard.press('ArrowRight');

      expect(await checkedOption(group)).toBe(second);
      await expect(group.locator(CHECKED_OPTION)).toBeFocused();
    });

    test('should move the selection backward when ArrowLeft is pressed', async ({
      page,
    }) => {
      const group = sizeGroup(page);
      const [first, second] = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('ArrowDown');
      expect(await checkedOption(group)).toBe(second);

      await page.keyboard.press('ArrowUp');

      expect(await checkedOption(group)).toBe(first);
    });

    test('should wrap to the first size when ArrowRight passes the last', async ({
      page,
    }) => {
      const group = sizeGroup(page);
      const names = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('End');
      expect(await checkedOption(group)).toBe(names.at(-1));

      await page.keyboard.press('ArrowRight');

      expect(await checkedOption(group)).toBe(names[0]);
    });

    test('should jump to the last size on End and the first on Home', async ({
      page,
    }) => {
      const group = sizeGroup(page);
      const names = await optionNames(group);

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('End');

      expect(await checkedOption(group)).toBe(names.at(-1));

      await page.keyboard.press('Home');

      expect(await checkedOption(group)).toBe(names[0]);
    });

    // Every seeded size of a colour shares that colour's stock, so a group with
    // some sizes sold out cannot be reached from the catalog. The disabled-skip
    // branch is pinned in the SizeSelector unit spec instead.
    test('should keep an entirely sold-out size group out of the tab sequence', async ({
      page,
    }) => {
      // Seeded data: every beige SKU of classic-canvas-tee is out of stock.
      await colourGroup(page).getByRole('radio', { name: /Beige/ }).click();

      const group = sizeGroup(page);
      await expect(group.getByRole('radio').first()).toBeDisabled();
      await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(0);
    });
  });

  test.describe('a colour change driven by the keyboard', () => {
    test('should collapse the gallery exactly as a click does', async ({
      gotoHydrated,
      page,
    }) => {
      // Seeded data: Voyager Hoodie is green with several images and brown with
      // one, so the thumbnail strip disappears on the second colour. Every
      // colour of the five-colour product shares one image set, which is why
      // this claim needs a different product from the group above.
      await gotoHydrated(PRODUCT.path);
      const group = colourGroup(page);
      const thumbnails = page.getByRole('button', { name: /View image/ });

      await expect(thumbnails.first()).toBeVisible();

      await group.locator(CHECKED_OPTION).focus();
      await page.keyboard.press('ArrowRight');

      await expect(group.locator(CHECKED_OPTION)).toHaveAccessibleName('Brown');
      await expect(thumbnails).toHaveCount(0);
    });
  });

  test.describe('the newsletter form', () => {
    test('should reach the Subscribe button from the address field with Tab', async ({
      gotoHydrated,
      page,
    }) => {
      await gotoHydrated(ROUTES.home);

      await page.getByRole('textbox', { name: 'Email address' }).focus();
      await page.keyboard.press('Tab');

      await expect(
        page.getByRole('button', { name: 'Subscribe' }),
      ).toBeFocused();
    });
  });
});
