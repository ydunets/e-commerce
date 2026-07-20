import { expect, test } from '@playwright/test';
import { gotoHydrated, PRODUCT } from './helpers';

const SPECS_MARKER = 'aria-label="Product specifications"';
const SPECS_DELAY_MS = Number(process.env.E2E_SPECS_DELAY_MS ?? 800);
const TIMER_TOLERANCE_MS = 50;
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

type Flush = { html: string; elapsedMs: number };

/** Read the body flush by flush, snapshotting the HTML so far and when it arrived. */
async function readInFlushes(
  response: Response,
  startedAt: number,
): Promise<Flush[]> {
  const decoder = new TextDecoder();
  const flushes: Flush[] = [];
  let html = '';

  for await (const chunk of response.body!) {
    html += decoder.decode(chunk, { stream: true });
    flushes.push({ html, elapsedMs: Date.now() - startedAt });
  }
  return flushes;
}

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

  const flushes = await readInFlushes(response, startedAt);
  const productArrival = flushes.find((f) => f.html.includes(PRODUCT.name));
  const specsArrival = flushes.find((f) => f.html.includes(SPECS_MARKER));

  expect(
    flushes.length,
    'response must arrive in more than one flush',
  ).toBeGreaterThan(1);
  expect(productArrival, 'product must arrive in an early flush').toBeDefined();
  expect(productArrival!.html).not.toContain(SPECS_MARKER);
  expect(
    specsArrival,
    'specifications must arrive by stream end',
  ).toBeDefined();

  // The shell must reach the client while the specifications request is
  // still pending; a buffered response delivers everything after the delay.
  expect(productArrival!.elapsedMs).toBeLessThan(SPECS_DELAY_MS);
  expect(specsArrival!.elapsedMs).toBeGreaterThanOrEqual(
    SPECS_DELAY_MS - TIMER_TOLERANCE_MS,
  );

  // The deferred boundary streams in later as markup plus an inline script
  // carrying the dehydrated Await data.
  const fullHtml = flushes.at(-1)!.html;
  const streamedTail = fullHtml.slice(productArrival!.html.length);
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
