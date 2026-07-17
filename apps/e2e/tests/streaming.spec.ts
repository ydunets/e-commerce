import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT } from './helpers';

const SPECS_MARKER = 'aria-label="Product specifications"';
// Must match the delay applied by scripts/start-prod-client.mjs.
const SPECS_DELAY_MS = Number(process.env.E2E_SPECS_DELAY_MS ?? 800);
const TIMER_TOLERANCE_MS = 50;
// renderRouterToStream gates on isbot(): bots get fully buffered HTML
// (await allReady), and Node's fetch default UA counts as a bot. A browser
// UA is required to exercise the streaming path this spec exists to test.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

test('streams the product shell before the specifications section', async ({
  baseURL,
}) => {
  const startedAt = Date.now();
  const response = await fetch(new URL(PRODUCT.path, baseURL), {
    headers: {
      accept: 'text/html',
      'accept-encoding': 'gzip',
      'user-agent': BROWSER_UA,
    },
  });

  expect(response.ok).toBe(true);
  // A streamed response is chunked; a buffered one advertises its length.
  expect(response.headers.get('content-length')).toBeNull();

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let flushes = 0;
  let htmlWhenProductAppeared: string | null = null;
  let productElapsedMs = Number.NaN;
  let specsElapsedMs = Number.NaN;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    flushes += 1;
    html += decoder.decode(value, { stream: true });
    if (htmlWhenProductAppeared === null && html.includes(PRODUCT.name)) {
      htmlWhenProductAppeared = html;
      productElapsedMs = Date.now() - startedAt;
    }
    if (Number.isNaN(specsElapsedMs) && html.includes(SPECS_MARKER)) {
      specsElapsedMs = Date.now() - startedAt;
    }
  }

  expect(flushes, 'response must arrive in more than one flush').toBeGreaterThan(1);
  expect(
    htmlWhenProductAppeared,
    'product must arrive in an early flush',
  ).not.toBeNull();
  expect(htmlWhenProductAppeared!).not.toContain(SPECS_MARKER);

  // The shell must reach the client while the specifications request is
  // still pending; a buffered response delivers everything after the delay.
  expect(productElapsedMs).toBeLessThan(SPECS_DELAY_MS);
  expect(specsElapsedMs).toBeGreaterThanOrEqual(
    SPECS_DELAY_MS - TIMER_TOLERANCE_MS,
  );

  // The deferred boundary streams in later as markup plus an inline script
  // carrying the dehydrated Await data.
  const streamedTail = html.slice(htmlWhenProductAppeared!.length);
  expect(streamedTail).toContain(SPECS_MARKER);
  expect(streamedTail).toContain('<script');
});

test('swaps the streamed section in and hydrates cleanly', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  // React 18+ hydration mismatches are thrown errors that recover by
  // re-rendering the boundary, so the page can look fine while hydration
  // actually failed. Only the error channels reveal it.
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await gotoHydrated(page, PRODUCT.path);

  await expect(
    page.getByRole('region', { name: 'Product specifications' }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
