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
- API response shapes are already asserted by the unit specs under
  `apps/server`, so the e2e suite verifies status, headers, and observable
  behaviour rather than snapshotting payloads. A second source of truth for the
  same contract is worse than none.

## Ticket 1: deterministic harness and API-level verification

**Blocked by:** nothing, can start immediately.

**Delivers.** The suite runs on typed fixtures rather than free functions, every
failure carries its own evidence into the report, a stray console error fails
the test that produced it, and the REST surface is verified directly rather than
only through the user interface. Verifiable by running `--grep @smoke` and
reading the resulting report.

- Raise `@playwright/test` to `^1.62.1` and confirm the lockfile resolution.
- Introduce an extended `test` exposing a page-bound hydration fixture that
  replaces the free function in `tests/helpers.ts`, a worker-scoped API client
  built on `request.newContext()`, an automatic fixture that fails a test on
  `pageerror` or console errors, and an option fixture supplying the API base
  URL from `use`.
- Wrap the multi-phase cart and product detail flows in `test.step`, attaching
  payloads through `testInfo.attach`.
- Add the tags `@smoke`, `@critical`, and `@slow`, annotations through
  `test.info().annotations`, `test.describe.configure` where serial execution is
  genuinely required, and package scripts driven by `--grep`.
- Assemble the assertion toolkit: `expect.soft` for independent page facts,
  `expect.poll` for the navbar cart badge, `expect.toPass` for eventually
  consistent reads, `expect.configure` for the streaming assertions, and one
  custom matcher through `expect.extend`.
- Verify the REST surface with `APIRequestContext`, covering the review, cart,
  and newsletter routes, `expect(response).toBeOK()`, status and header
  assertions on the error paths, and a sanity check of the Swagger document.
- Diagnostics and configuration: an explicit `Tracing` start and stop around one
  flow with the trace attached, a minimal reporter written against
  `reporter.d.ts`, `failOnFlakyTests` under CI, an explicit `expect` timeout,
  `screenshot: 'only-on-failure'`, and `video: 'retain-on-failure'`. The
  existing `trace: 'on-first-retry'` policy stays, since a broader policy costs
  disk on every local run.

## Ticket 2: deterministic state, time, and network

**Blocked by:** Ticket 1, whose fixtures every exercise here consumes.

**Delivers.** Any spec can begin from a populated cart, a frozen clock, and a
replayed network, which makes the previously timing-sensitive flows reproducible
and covers the offline branch that no unit test may own.

- Add a `setup` project consumed through `dependencies`. It creates a cart over
  the API and writes `storageState` containing the cart identifier that the
  client keeps in `localStorage`, so the cart specs no longer replay the add
  flow. No database mutation outside the public API.
- Clock control: `setFixedTime` to freeze the dates rendered by the review
  widget, `install` with `fastForward` for the footer year rollover, and
  `runFor` or `pauseAt` for the newsletter form debounce.
- Network: record and replay the products listing with `routeFromHAR`, cover
  `route` with `fulfill`, `abort`, and `continue` overrides, then `unrouteAll`,
  `context.setOffline` for the offline branch, and `page.requestGC` where a leak
  assertion is meaningful.

## Ticket 3: rendering baselines, accessibility, and the Tier B surfaces

**Blocked by:** Tickets 1 and 2. Stable screenshots require the frozen clock and
the seeded cart, otherwise every baseline drifts on the rendered dates.

**Delivers.** Pixel and ARIA baselines that hold across consecutive runs,
accessibility budgets per route, and four new storefront surfaces that exist
specifically so the remaining browser capabilities can be exercised against real
markup rather than a fixture.

- Application surfaces, in their own commit, each plausible for a storefront: an
  embedded specification iframe on the product page, an optional review photo
  upload field, a dismissible cookie banner in the root layout, and a
  specification sheet download link.
- Rendering: `toHaveScreenshot` on the product grid and the details page using
  `mask`, a `stylePath` that neutralises animation, and a `maxDiffPixelRatio`
  justified by the release notes; `toMatchAriaSnapshot` for the navbar, a product
  card, and the footer; `emulateMedia` for `colorScheme`,
  `prefers-reduced-motion`, and `print`; touchscreen gestures inside the existing
  mobile project.
- Tier B specs: `FrameLocator` against the iframe, `setInputFiles` together with
  the `filechooser` event, `waitForEvent('download')` with `download.saveAs`,
  `addLocatorHandler` and `removeLocatorHandler` for the banner,
  `grantPermissions` with `setGeolocation` should the shipping estimate consume a
  position, and accessibility checks through a new `@axe-core/playwright` dev
  dependency with a documented violation budget per route.
- Scratch exercises under `apps/e2e/scratch/`, excluded from the default
  projects: multi-role `storageState` against a stub login page served by the
  e2e package, since the application has no authentication, and `routeWebSocket`
  with `WebSocketRoute` against a stub socket page, since the client uses neither
  WebSocket nor EventSource.
- A written note on Tier C, covering Electron, Android, browser extensions,
  Playwright component testing, `clientCertificates`, HTTP credentials, and
  service worker behaviour, each with the reason it is inapplicable here.

## Verification gate

Each ticket closes with a correctness-focused code review before the next one
starts, so a defective fixture layer never propagates into the specs built on
top of it.
