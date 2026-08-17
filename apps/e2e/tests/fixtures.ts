import {
  type APIRequestContext,
  expect as baseExpect,
  type Locator,
  request,
  test as base,
} from '@playwright/test';

/**
 * API origin, not the route prefix: the versioned routes live under `/api/v1`
 * while `/health` and `/api-docs/json` sit outside it.
 */
export const API_ORIGIN = 'http://localhost:4000';

/**
 * The production build streams a deferred section, so hydration lands there
 * noticeably later than the default assertion timeout allows.
 */
const HYDRATION_TIMEOUT_MS = 15_000;

const CART_LABEL = 'Shopping bag';

/**
 * Chromium logs a resource failure for every aborted or error-fulfilled
 * request. A spec that provokes one on purpose declares this allowance for
 * itself; it is deliberately not the default, so a new spec starts strict.
 */
export const BLOCKED_REQUEST_NOISE = ['Failed to load resource'];

/** Overridable from `use` in the config, a project, or a single spec. */
export type TestOptions = {
  /**
   * Regular expression sources for the console errors the spec provokes
   * deliberately. Sources rather than RegExp objects, because option values
   * cross a process boundary and a RegExp does not survive it.
   */
  allowedConsoleErrors: string[];
};

export type WorkerOptions = {
  apiBaseURL: string;
};

type TestFixtures = TestOptions & {
  errorGuard: void;
  gotoHydrated: (path: string) => Promise<void>;
};

type WorkerFixtures = WorkerOptions & {
  api: APIRequestContext;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  apiBaseURL: [API_ORIGIN, { scope: 'worker', option: true }],

  api: [
    async ({ apiBaseURL }, use) => {
      const context = await request.newContext({ baseURL: apiBaseURL });
      await use(context);
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  allowedConsoleErrors: [[], { option: true }],

  errorGuard: [
    async ({ context, allowedConsoleErrors }, use) => {
      const allowed = allowedConsoleErrors.map((source) => new RegExp(source));
      const unexpected: string[] = [];
      const record = (text: string) => {
        if (!allowed.some((pattern) => pattern.test(text))) {
          unexpected.push(text);
        }
      };

      context.on('console', (message) => {
        if (message.type() === 'error') {
          record(message.text());
        }
      });
      // React recovers from a hydration mismatch by re-rendering the boundary,
      // so the page can look right while hydration actually failed. Only the
      // error channel reveals it.
      context.on('weberror', (webError) => record(webError.error().message));

      await use();

      baseExpect(unexpected, 'the page reported unexpected errors').toEqual([]);
    },
    { auto: true },
  ],

  /**
   * Navigate and wait until React has hydrated. The root layout sets
   * `data-hydrated` on <html> from a post-hydration effect; interacting before
   * that point silently drops events on server-rendered markup.
   */
  gotoHydrated: async ({ page }, use) => {
    const expectHydrated = baseExpect.configure({
      timeout: HYDRATION_TIMEOUT_MS,
    });

    await use(async (path) => {
      await page.goto(path);
      await expectHydrated(
        page.locator('html[data-hydrated="true"]'),
      ).toBeAttached();
    });
  },
});

export const expect = baseExpect.extend({
  /**
   * Asserts the navbar badge reports the given number of units, phrased the way
   * the storefront phrases it, so a spec never restates the label grammar.
   */
  async toHaveCartCount(
    link: Locator,
    expected: number,
    options?: { timeout?: number },
  ) {
    const assertionName = 'toHaveCartCount';
    const units = expected === 1 ? 'item' : 'items';
    const accessibleName =
      expected === 0 ? CART_LABEL : `${CART_LABEL}, ${expected} ${units}`;
    let pass: boolean;
    let matcherResult: { actual?: unknown } | undefined;

    try {
      const expectation = this.isNot ? baseExpect(link).not : baseExpect(link);
      await expectation.toHaveAccessibleName(accessibleName, {
        timeout: options?.timeout ?? this.timeout,
      });
      pass = true;
    } catch (error) {
      matcherResult = (error as { matcherResult?: { actual?: unknown } })
        .matcherResult;
      pass = false;
    }
    if (this.isNot) {
      pass = !pass;
    }

    return {
      name: assertionName,
      pass,
      expected: accessibleName,
      actual: matcherResult?.actual,
      message: () =>
        `${this.utils.matcherHint(assertionName, 'locator', String(expected), {
          isNot: this.isNot,
        })}\n\n` +
        `Locator: ${link}\n` +
        `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(
          accessibleName,
        )}\n` +
        (matcherResult
          ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
          : ''),
    };
  },
});
