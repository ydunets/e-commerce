# Advanced Playwright coverage plan

Branch: `test/e2e-playwright-advanced`, based on `origin/main` at `621cfda`.
Playwright: `1.62.0` raised to `1.62.1`, the current `latest` dist-tag.

## Agreed frame

1. **Permanence.** Everything hostable by the application today lands as a kept
   spec under `apps/e2e/tests` and must stay green. Capabilities the application
   cannot host go to `apps/e2e/scratch/`, excluded from the default projects, so
   they read as worked examples without gating a run.
2. **Coverage boundary.** The whole of Tier A below is implemented. Tier B is
   limited to surfaces buildable in roughly twenty lines of application code.
   Tier C is read from the documentation and the installed source, then
   documented as inapplicable.
3. **Application changes are permitted** where the surface is something a real
   storefront would plausibly ship, and always in a commit separate from the
   test work.
4. **Sources.** Installed `playwright@1.62.1` types first, then context7 for the
   documentation pages, then `microsoft/playwright` itself for release notes
   covering 1.60 to 1.62, closed issues, and `packages/playwright-core`.
   Third-party suites are out of scope.

## Constraints that bound the work

- Locally the suite reuses the dev servers on 5173 and 4000, and the e2e
  Postgres has no volume. Consequently no exercise may introduce a
  `globalSetup` or `globalTeardown` that seeds or truncates the database; state
  is prepared through the public API instead, inside a setup project.
- The `streaming-prod` project performs a full production build under a 240
  second timeout, so each additional project or `webServer` is charged to wall
  clock on every run. Only one further project is added, and it is cheap.

## Ticket 1: harness, fixtures, and the assertion toolkit

Branch scope: `apps/e2e` only, no application code.

- Raise `@playwright/test` to `^1.62.1` and confirm the lockfile resolves it.
- Introduce `tests/fixtures.ts` exporting an extended `test`: a page-bound
  `gotoHydrated` fixture replacing the free function in `tests/helpers.ts`, a
  worker-scoped `api` fixture built on `request.newContext()`, an automatic
  fixture that fails a test on `pageerror` or console errors, and an option
  fixture supplying the API base URL from `use` in the configuration.
- Wrap the multi-phase flows in `cart.spec.ts` and `product-details.spec.ts` in
  `test.step`, attaching payloads through `testInfo.attach` so a failure carries
  its evidence into the HTML report.
- Add the tags `@smoke`, `@critical`, and `@slow`, `test.describe.configure`
  where serial execution is genuinely required, annotations through
  `test.info().annotations`, and package scripts driven by `--grep`.
- Assemble the assertion toolkit: `expect.soft` for independent page facts,
  `expect.poll` for the navbar cart badge, `expect.toPass` for eventually
  consistent API reads, `expect.configure` for the streaming assertions, and one
  custom matcher through `expect.extend`.
- Exercise `APIRequestContext` against `/v1/products/:productId/reviews`,
  `/v1/carts/:cartId`, and `/v1/newsletter/subscriptions`, including
  `expect(response).toBeOK()` and a sanity check of the Swagger document.
- Configuration: `failOnFlakyTests` under CI, an explicit `expect` timeout,
  `screenshot: 'only-on-failure'`, and `video: 'retain-on-failure'`. The
  existing `trace: 'on-first-retry'` policy stays, since a broader policy costs
  disk on every local run.

Acceptance: `pnpm e2e` green, `pnpm --filter @e-commerce/e2e check` clean,
`--grep @smoke` selecting a strict subset, and the custom matcher producing a
readable diff when the cart count is wrong.

## Ticket 2: seeded state, clock control, network replay, visual and ARIA baselines

Branch scope: `apps/e2e` only.

- Add a `setup` project consumed through `dependencies`. It creates a cart over
  the API and writes `storageState` containing the cart identifier that
  `apps/client/src/entities/cart/lib/cartStorage.ts` keeps in `localStorage`.
  The cart specs then start from a populated cart without replaying the add flow.
- Clock control: `setFixedTime` to freeze the dates rendered by
  `apps/client/src/widgets/product-reviews/lib/format-date.ts`, `install` with
  `fastForward` for the footer year rollover, and `runFor` or `pauseAt` for the
  newsletter form debounce.
- Network: record and replay the products listing with `routeFromHAR`, cover
  `route` with `fulfill`, `abort`, and `continue` overrides, then `unrouteAll`,
  `context.setOffline` for the offline branch, and `page.requestGC` where a leak
  assertion is meaningful.
- Visual: `toHaveScreenshot` on the product grid and the details page using
  `mask`, a `stylePath` that neutralises animation, and a `maxDiffPixelRatio`
  justified by the release notes; `toMatchSnapshot` for one serialised API
  payload.
- ARIA: `toMatchAriaSnapshot` for the navbar, a product card, and the footer.
- Emulation: `emulateMedia` for `colorScheme`, `prefers-reduced-motion`, and
  `print`, plus touchscreen gestures inside the existing mobile project.
- Diagnostics: an explicit `Tracing` start and stop around one flow with the
  trace attached, a `CDPSession` driving `ChromiumCoverage` over the home route,
  and a minimal reporter written against `reporter.d.ts`.

Acceptance: baselines stable across two consecutive runs, the seeded project
measurably shortening the cart specs, and reporter output landing in
`test-results`.

## Ticket 3: Tier B surfaces and scratch exercises

Two commits, application code first and tests second.

- Application surfaces, each plausible for a storefront: an embedded
  specification iframe on the product page, an optional review photo upload
  field, a dismissible cookie banner in the root layout, and a specification
  sheet download link.
- Specs: `FrameLocator` against the iframe, `setInputFiles` together with the
  `filechooser` event for the upload, `waitForEvent('download')` and
  `download.saveAs` for the sheet, `addLocatorHandler` and
  `removeLocatorHandler` for the banner, `grantPermissions` with
  `setGeolocation` should the shipping estimate consume a position, and
  accessibility checks through a new `@axe-core/playwright` dev dependency with
  a documented violation budget per route.
- Scratch exercises under `apps/e2e/scratch/`, excluded from the default
  projects: multi-role `storageState` against a stub login page served by the
  e2e package, since the application has no authentication, and `routeWebSocket`
  with `WebSocketRoute` against a stub socket page, since the client uses
  neither WebSocket nor EventSource.
- A written note on Tier C, covering Electron, Android, browser extensions,
  Playwright component testing, `clientCertificates`, HTTP credentials, and
  service worker behaviour, each with the reason it is inapplicable here.

Acceptance: the default `pnpm e2e` run stays green and never touches scratch,
the accessibility budgets are recorded, and the application diff is reviewable
on its own.

## Verification gate

Each ticket closes with a correctness-focused code review before the next one
starts, so a defective fixture layer never propagates into the specs built on
top of it.
