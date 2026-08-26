import { mkdtempSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COOKIE_BANNER, expect, test } from './fixtures';
import { COOKIE_CHOICE_KEY, PRODUCT, ROUTES } from './helpers';

const SPEC_SHEET_FRAME = { name: 'Care and materials' } as const;
const DOWNLOAD_BUTTON = { name: 'Download specification sheet' } as const;
const SHEET_FILE_NAME = 'stylenest-specification-sheet.csv';
const SHEET_HEADER = 'section,feature';

const REVIEWS_BUTTON = { name: /reviews/ } as const;
const PHOTO_FIELD = { name: 'Add a photo' } as const;
const REMOVE_PHOTO = { name: 'Remove' } as const;
const ACCEPT_COOKIES = { name: 'Accept cookies' } as const;

// A 1x1 transparent GIF: the smallest thing the picker will accept.
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

function writeTempImage(name: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'e2e-photo-')), name);
  writeFileSync(path, PIXEL_GIF);
  return path;
}

test.describe('Storefront Surfaces', () => {
  test('should embed the care and materials sheet in a frame', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(PRODUCT.path);

    // Frame-scoped: the heading below lives in the embedded document, not in
    // the page that hosts it.
    const sheet = page.frameLocator(`iframe[title="${SPEC_SHEET_FRAME.name}"]`);

    await expect(sheet.getByText('Machine wash cold')).toBeVisible();
    await expect(sheet.getByText('Made in Portugal')).toBeVisible();
  });

  test('should download the specification sheet built from the rendered specifications', async ({
    gotoHydrated,
    page,
  }) => {
    await gotoHydrated(PRODUCT.path);

    const download = await test.step('trigger the download', async () => {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', DOWNLOAD_BUTTON).click();
      return pending;
    });

    expect(download.suggestedFilename()).toBe(SHEET_FILE_NAME);

    const body = await readFile(await download.path(), 'utf8');
    expect(body.split('\n')[0]).toBe(SHEET_HEADER);
    expect(body).toContain('Sustainability');
  });

  test.describe('the review photo picker', () => {
    test.beforeEach(async ({ gotoHydrated, page }) => {
      await gotoHydrated(PRODUCT.path);
      await page.getByRole('button', REVIEWS_BUTTON).click();
    });

    test('should preview a photo set on the file input and drop it again', async ({
      page,
    }) => {
      const dialog = page.getByRole('dialog');
      const picker = dialog.getByLabel(PHOTO_FIELD.name);

      await picker.setInputFiles(writeTempImage('sweater.gif'));

      const preview = dialog.getByRole('img', { name: /Preview of/ });
      await expect(preview).toBeVisible();
      await expect(dialog.getByText('sweater.gif')).toBeVisible();

      await dialog.getByRole('button', REMOVE_PHOTO).click();

      await expect(preview).toHaveCount(0);
    });

    test('should accept the photo a file chooser hands back', async ({
      page,
    }) => {
      const dialog = page.getByRole('dialog');

      const chooser = await test.step('open the chooser', async () => {
        const pending = page.waitForEvent('filechooser');
        await dialog.getByLabel(PHOTO_FIELD.name).click();
        return pending;
      });
      await chooser.setFiles(writeTempImage('scarf.gif'));

      await expect(dialog.getByText('scarf.gif')).toBeVisible();
    });
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
        await page.evaluate((key) => localStorage.getItem(key), COOKIE_CHOICE_KEY),
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
