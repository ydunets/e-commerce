# Playwright Best Practices

Adapted from [Playwright Best Practices: 8 Patterns for a Stable 2026 E2E
Suite](https://getautonoma.com/blog/playwright-best-practices-2026), with every
example taken from this repository's own suite under `apps/e2e`. Where this
suite deviates from the article, the deviation and its reason are stated.

## 1. Selector strategy: the hierarchy that holds

Follow Playwright's own ranking: `getByRole` first, then `getByLabel` and
`getByPlaceholder` for form fields, then `getByText` for unique visible copy,
then `getByTestId` as a deliberate fallback, and CSS or XPath only when nothing
user-facing exists. A role locator expresses intent and is anchored in the
accessibility tree, so it survives renames and restyles, and it doubles as an
accessibility check: when `getByRole('button', { name: 'Add to Cart' })` finds
nothing, a screen reader is probably lost too.

This suite is role-first throughout:

```ts
// cart.spec.ts
const cartLink = (page: Page) =>
  page.getByRole('link', { name: /shopping bag/i });

await page.getByRole('button', { name: 'Add to Cart' }).click();
```

A raw CSS locator appears only where the DOM attribute itself is the claim
being tested, which is the legitimate use of the bottom tier:

```ts
// keyboard.spec.ts — roving tabindex is the behaviour under test,
// so the attribute is the subject, not a shortcut to an element.
const CHECKED_SWATCH = '[role="radio"][aria-checked="true"]';
await expect(group.locator('[role="radio"][tabindex="0"]')).toHaveCount(1);
```

This codebase has no `data-testid` attributes, and none should be added while
roles and labels still identify every control.

## 2. Timeouts and retries: configure, do not fight

Do not raise the global test timeout when an assertion is slow. Set a tight
explicit assertion timeout for the whole suite, then override it only where the
UI genuinely needs longer, with a comment saying why. The suite pins both:

```ts
// playwright.config.ts
// Above the storefront's own request latency, below the point where a
// genuinely stuck assertion stops looking stuck.
const ASSERTION_TIMEOUT_MS = 7_000;
expect: { timeout: ASSERTION_TIMEOUT_MS },
```

```ts
// fixtures.ts — the one justified override: the production build streams a
// deferred section, so hydration lands later than the default allows.
const HYDRATION_TIMEOUT_MS = 15_000;
const expectHydrated = baseExpect.configure({ timeout: HYDRATION_TIMEOUT_MS });
```

Retries are a band-aid, not a fix. Locally the suite runs with `retries: 0`,
so a race fails loudly at the desk. CI keeps `retries: 2` for infrastructure
noise but pairs it with `failOnFlakyTests: true`, so a test that only passes
on retry still fails the run. That combination is stricter than the article's
recommendation and is deliberate: a flake that survives to `main` costs more
than a red build.

For eventually consistent state, use `expect.poll` on a computed value or
`expect(...).toPass` around a block, never a sleep:

```ts
// cart.spec.ts — the click resolves before the write lands.
await expect
  .poll(async () => (await serverCart(api, cartId!))?.totalUnits, {
    message: 'the server cart must report both clicks',
  })
  .toBe(2);

// api.spec.ts — a cold container provisions its schema during startup.
await expect(async () => {
  const response = await api.get(HEALTH_ROUTE);
  expect(response).toBeOK();
}).toPass({ intervals: READINESS_INTERVALS_MS, timeout: READINESS_TIMEOUT_MS });
```

The distinction: `poll` retries a value, `toPass` retries a procedure. Use the
narrowest form that fits, and name the bounds as constants rather than leaving
literals at the call site.

## 3. Parallelism: workers first, sharding later

Workers parallelise within one machine; sharding splits the suite across CI
machines. Get isolation right under workers before considering shards. This
suite runs `fullyParallel: true` with default workers locally and `workers: 1`
on CI, and every test owns its state: carts are created per test through the
public API, newsletter subscriptions use `uniqueEmail()`, and nothing truncates
the shared database. At the current size (65 tests, under half a minute)
sharding would add configuration for no wall-clock gain; revisit past the
five-minute mark.

## 4. Fixtures: business state, not API wrappers

A fixture should hand the test a ready condition, not save keystrokes on
Playwright calls. The suite's extended `test` in `tests/fixtures.ts` carries:

- `gotoHydrated`, which encodes an application contract (the root layout stamps
  `data-hydrated` on `<html>` after hydration; interacting earlier drops events
  on server-rendered markup),
- `api`, a worker-scoped `APIRequestContext`, expensive setup shared across a
  worker,
- `errorGuard`, an automatic fixture that fails any test whose page logs an
  uncaught error (see anti-patterns),
- `apiBaseURL` and `allowedConsoleErrors`, option fixtures overridable from
  config, project, or a single `test.use`.

Scoping rules of thumb: `scope: 'worker'` for anything expensive and
read-only, default test scope for anything that must reset between tests,
`option: true` for values a spec may override. One non-obvious constraint,
learned here the hard way: option values cross a process boundary, so a
`RegExp` object does not survive; pass pattern sources as strings and compile
them inside the fixture.

## 5. Trace viewer: the first move on any flaky test

Keep `trace: 'on-first-retry'` (not `'on'`, which inflates artifacts with
passing-test traces). When a test fails in CI, download the trace and open it:

```bash
pnpm --filter @e-commerce/e2e exec playwright show-trace test-results/<test>/trace.zip
```

The suite also exercises the API directly in `tracing.spec.ts`: it disables
the automatic policy for that one spec (`test.use({ trace: 'off' })`, because
two concurrent recordings throw), records the add-to-cart flow explicitly, and
attaches the archive to the report. Failures carry their evidence with them:
`screenshot: 'only-on-failure'` and `video: 'retain-on-failure'` are set
suite-wide, and multi-phase flows attach payloads through `testInfo.attach`
before the assertions that rely on them, so a failure ships the state that
produced it.

## 6. CI flakiness: the fixes that work

Of the article's four fixes, three apply here and one is replaced by something
stronger.

1. **Explicit bounds.** The assertion timeout is pinned (pattern 2). Action
   and navigation timeouts stay at their defaults for now; the per-test
   timeout is the backstop, and no test approaches it.
2. **Navigation waits.** The article suggests `waitUntil: 'networkidle'` for
   apps that fetch on load. Playwright's own documentation marks `networkidle`
   as discouraged, and this suite does not need it: `gotoHydrated` waits on a
   landmark only the application can produce, the `data-hydrated` attribute,
   which is exactly the "specific waitFor on a landmark element" the article
   offers as the alternative. Prefer an application-owned readiness signal
   over a network heuristic.
3. **Artifacts on failure.** Screenshots and videos are retained on failure
   only (pattern 5).
4. **Environment assumptions.** Seeded rows a test depends on are named in a
   `seeded-data` annotation on the test itself. Dates are currently asserted
   through `new Date().getUTCFullYear()` in the footer spec; clock control
   lands with ticket #47, after which time-dependent assertions freeze the
   clock instead.

One CI-specific hazard is documented as a `known-issue` annotation on the
streaming group: `rsbuild dev` rewrites `dist/manifest.json`, so the
production preview must never share a run with the dev server.

## 7. Authentication: storageState, once per role

This storefront has no authentication, so the pattern is recorded for when it
arrives. Log in once in a setup project, write `storageState` to a
`.gitignore`-d file, and consume it through project `dependencies`; per-role
state means one setup run per role, and state files are regenerated per CI run
because committed tokens expire into mysterious failures. The suite already
uses the same mechanism for a cheaper resource: ticket #47 seeds a cart over
the API in a setup project and writes the cart id into `storageState`, so cart
specs start populated without replaying the add flow. The official API-testing
guide documents that storage state is interchangeable between
`APIRequestContext` and `BrowserContext`, which is what makes API-driven
seeding legitimate rather than a trick. Never hand-write the JSON; run the
real flow and save what was actually stored.

## 8. Page objects: let duplication ask for them

Composable fixtures give this suite what a Page Object Model would (reuse,
isolation, readable tests) without class ceremony. The threshold to watch:
when the same interaction logic is duplicated across many fixtures or specs,
extract then, not before. Current shared vocabulary lives in two places and
that is enough: `tests/helpers.ts` for data (`PRODUCT`, `ROUTES`,
`CartResponse`, `readJson`) and `tests/fixtures.ts` for behaviour. Small
per-file locator helpers (`cartLink`, `footer`, `colourGroup`) stay in their
spec files until a second file needs them.

## Anti-patterns, checked against this suite

**Hardcoded sleeps.** `waitForTimeout` appears nowhere in the suite. Waiting
is always condition-based: a locator assertion, `expect.poll`, or `toPass`.

**Global state mutations.** No test mutates shared state destructively. Carts
are per-test, emails are unique per run, and no `globalSetup` touches the
database, a hard constraint here because the e2e Postgres has no volume and
shares its schema with the dev stack.

**Ignoring the browser console.** Solved structurally rather than by
discipline: the automatic `errorGuard` fixture listens on the context for
`console` errors and `weberror` events and fails the test that produced them.
The default allowance is empty; a spec that provokes noise on purpose declares
it, scoped to a single test where only one test needs it:

```ts
// cart.spec.ts — reading a stale cart 404s by design; every other
// cart test stays strict.
test.describe('with a stale cart id', () => {
  test.use({ allowedConsoleErrors: BLOCKED_REQUEST_NOISE });
  ...
});
```

React makes this guard load-bearing: a hydration mismatch recovers by
re-rendering the boundary, so the page can look correct while hydration
actually failed. Only the error channel reveals it.

**Testing implementation, not behaviour.** Titles state observable outcomes
(`should update the navbar badge without a reload when an item is added to the
cart`), locators are role-based, and API specs assert statuses and behaviour
rather than snapshotting bodies, because the server's unit specs already own
those shapes. The one sanctioned exception is when the implementation detail
is itself the contract under test, as with the roving tabindex assertions.

**One test file per page.** Files map to features, not routes:
`cart.spec.ts` follows the cart across the product page, the navbar, reload,
and navigation; `keyboard.spec.ts` follows keyboard operation across two
widgets and a form. Each file opens one feature-level `test.describe`, so
reports group by behaviour.

## Conventions specific to this suite

- Titles follow `should <outcome> when <condition>`; groups are noun phrases.
- Selection runs through tags (`@smoke`, `@critical`, `@slow`) and the
  `test:smoke` / `test:critical` / `test:not-slow` scripts, never through
  bracket markers in titles.
- Annotations carry the why a title cannot: `seeded-data` for assertions bound
  to seed rows, `edge-case` for deliberately provoked conditions,
  `known-issue` for documented hazards, plus a runtime-pushed `trace`
  annotation where the value only exists mid-test.
- Named constants over literals, including status codes (`STATUS_NOT_FOUND`),
  poll bounds, and seeded facts, each with a comment naming its source.
- Body reads go through `readJson<T>(response)` so the cast that
  `APIResponse.json()` forces lives in one place.
