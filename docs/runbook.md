# Runbook: from cold start to running stack

Every way to run this monorepo, in order. All commands run from the repo root unless a path is shown.

## 1. Prerequisites (one-time)

| Requirement | Why | Check |
|---|---|---|
| Node 24.18.0 | Agreed compiled-server and CI baseline | `node -v` → `v24.18.0` (`nvm use 24.18.0`) |
| corepack enabled | pnpm is pinned via `packageManager` in package.json; corepack fetches 11.18.0 automatically | `corepack enable` once, then `pnpm -v` → `11.18.0` |
| Docker Desktop | Postgres for the API | `docker info` |

Watch out: an interactive shell picks up nvm, but scripts/CI may resolve an old system Node. If pnpm fails with `node:sqlite` errors, your Node is too old.

## 2. Install

```bash
pnpm install
```

One lockfile at the root covers all three packages (`apps/client`, `apps/server`, `apps/storybook`).

## 3. Database (needed for the API)

```bash
cd apps/server
pnpm create:env          # copies .env.example → .env (skip if .env exists)
docker compose up -d postgres
pnpm db:migrate          # users + product tables
pnpm db:seed             # seed data
```

Postgres listens on host port **5433** (not 5432 — that's taken by another project on this machine; see `POSTGRES_HOST_PORT` in `.env`).

## 4. Development

### Full stack (one command)

```bash
pnpm dev
```

Completes the initial contracts and server builds, then starts the watchers concurrently, with output prefixed per package:

- **client** — SSR dev server with HMR at http://localhost:5173
- **server**: SWC compilation and the compiled Fastify API in Node watch mode at http://localhost:4000.

The client proxies `/api/*` to the API, so the browser only ever talks to :5173. Sanity check:

```bash
curl localhost:5173/about                                # SSR page (200)
curl localhost:5173/api/v1/products/voyager-hoodie       # product JSON via proxy
```

### Pieces individually

```bash
pnpm dev:client     # client only (SSR pages work; /api calls fail until the API is up)
pnpm api            # API only (direct on :4000)
pnpm storybook      # component workshop at http://localhost:6006
```

Ports: client 5173 (3000 is squatted by Docker on this machine), API 4000, storybook 6006, Postgres 5433. Override with `PORT=` (client/API) or `API_URL=` (where the client proxy points).

## 5. Checks

```bash
pnpm check          # everything, all packages, concurrent (~3-4s):
                    #   client:    biome + tsc + rstest
                    #   server:    biome + tsc + unit tests
                    #   storybook: static build
```

Granular: `pnpm check:client`, `pnpm api:check`, `pnpm test`, or any `pnpm --filter <pkg> check:lint|check:types|check:test`. Server-only extras (run in `apps/server`): `pnpm test:characterisation` (Cucumber HTTP characterisation, needs DB), `pnpm deps:validate` (architecture rules).

## 6. End-to-end tests (Playwright, `apps/e2e`)

### One-time setup

```bash
pnpm --filter @e-commerce/e2e exec playwright install chromium
```

Downloads the Chromium build Playwright drives (~95 MB, cached in `~/Library/Caches/ms-playwright`). Docker Desktop must be running.

### Running

```bash
pnpm e2e            # whole suite: desktop + mobile projects (~10s when servers are warm)
pnpm e2e:desktop    # desktop-chromium project only (skips the 2 mobile specs)
pnpm e2e:mobile     # mobile-chromium project only (the mobile-*.spec.ts files)
pnpm e2e:ui         # interactive UI mode (watch, pick tests, time-travel DOM)
```

Scope narrower by appending a file or `-g <title>` to any of these, e.g. `pnpm e2e:desktop tests/product-details.spec.ts`. Rule of thumb: single route/spec → run that file; shared component, tokens, or `__root` → run the full `pnpm e2e` (a shared change often fails a *different* spec than the one you edited).

Nothing needs to be started beforehand — the suite is self-provisioning:

1. Playwright's `webServer` starts the client dev server (5173) and the API (4000). The API command is a wrapper (`scripts/start-api.mjs`) that first runs `docker compose up -d --wait postgres` — Playwright launches webServers *before* `globalSetup`, so the DB must be provisioned in the API's own startup chain, not in global setup.
2. Readiness is polled on `/api/v1/users`, which only turns 200 once API **and** DB are up — so a green start proves the whole chain.
3. Locally, already-running servers are **reused** (so keep `pnpm dev` running for fastest iterations); on CI (`CI=1`) fresh servers are required. Caveat of reuse: if a *stale API without a database* already holds port 4000, the wrapper never runs and readiness polling times out — kill the stale process (or start the DB) first.

The database keeps running after tests finish; stop it as in section 8 if you want it down.

### Useful variants (run from `apps/e2e`, or prefix with `pnpm --filter @e-commerce/e2e exec`)

```bash
playwright test tests/product-details.spec.ts   # one file
playwright test -g "quantity stepper"           # by test title
playwright test --project=desktop-chromium      # one project only
playwright test --headed                        # watch the browser
playwright test --debug                         # step through with the inspector
playwright test --repeat-each=3                 # flakiness check (do this for new tests)
playwright show-report                          # open the last HTML report
playwright show-trace <path-to-trace.zip>       # inspect a failure trace (recorded on CI retry)
```

### Conventions

- **Projects by filename**: `tests/mobile-*.spec.ts` runs only in the `mobile-chromium` project (Pixel 7 emulation); every other spec runs only in `desktop-chromium`. Name files accordingly — no in-test viewport switching.
- **Always navigate via `gotoHydrated(page, path)`** from [tests/helpers.ts](../apps/e2e/tests/helpers.ts), never bare `page.goto` (unless the test intentionally exercises pre-hydration SSR, like the blocked-JS test). It waits for `html[data-hydrated]`, set by a root-layout effect — SSR markup silently swallows clicks before React attaches.
- Follow [tests/best-practices.md](tests/best-practices.md): role-based locators (`getByRole`), web-first assertions (`await expect(...).toBeVisible()`), named constants instead of magic strings, no `waitForTimeout`.
- Tests hit the **real seeded database** (voyager-hoodie), so assertions may rely on seeded facts — when seeds change, expect e2e updates.

## 7. Production build

```bash
pnpm build          # contracts first, then client SSR and compiled server
pnpm preview        # serve it on :3000 (use PORT=4173 here — 3000 is squatted)
```

The preview server also proxies `/api/*`, so run the API alongside (`pnpm api`) for data routes. For the API in production mode: `pnpm --filter @e-commerce/server start:prod`.

### Compiled API execution

Shared contracts use Zod 4.4.3. Legacy Fastify consumers temporarily convert them with `toLegacySchema`, selecting input JSON Schema for requests and output JSON Schema for responses. Keep metadata and examples on the authoritative contracts; `id` identifies a Zod component, whereas `$id` supplies the literal legacy JSON Schema identifier. Remove this adapter when its final legacy consumer migrates.

The contracts package is side-effect-free. Its DTO types were checked against the previous TypeBox definitions during replacement, and a utility-only production bundle verified that `compareSizes` and `SIZE_RANK` do not retain Zod. `ReviewsPageResponseDto` remains a hand-written interface.

SWC 0.8.1 with core 1.16.1 preserves the two source roots as `apps/server/dist/src` and `apps/server/dist/tests`. Every ordinary build clears `dist` before compiling, preventing stale handlers and specifications after renames. TypeScript 7.0.2 remains the strict no-emit checker. Relative imports use `.js`; extensionless internal aliases resolve source under the checker's `development` condition and compiled output by default. Do not pass that condition to a runtime process.

`pnpm api` and package-level `pnpm start` or `pnpm dev` build contracts and the server before starting SWC and Node watchers. The lower-level `watch` command assumes those initial builds already exist. Development, unit tests, coverage and characterisation load an optional server `.env` before module preloads; explicit environment variables take precedence. Production requires platform-provided variables and does not require an environment file. All server runtime commands preload `reflect-metadata` and enable source maps; application commands additionally preload instrumentation.

```bash
pnpm --filter @e-commerce/server test:unit
pnpm --filter @e-commerce/server test:coverage
pnpm --filter @e-commerce/server test:characterisation
```

The first two commands remain database-free. Characterisation requires an isolated migrated and seeded PostgreSQL database; its feature text stays under `tests`, while support and step definitions execute from `dist/tests`. Coverage is remapped to source TypeScript. Keep the retained legacy unit specifications until their corresponding migration increment removes the relevant implementation.

### Final server image verification

```bash
docker build -f apps/server/Dockerfile -t e-commerce-server:local .
node apps/server/scripts/smoke-image.mjs e-commerce-server:local
```

The smoke check creates its own Docker network and PostgreSQL 18 container, applies migrations and seeds with pinned DBMate 2.33.0, and starts the final server image using synthetic platform-style variables. It checks health, product listing and details, non-root execution, source-map presence, and exclusion of application source, tests and development tooling. It then sends SIGTERM and requires a successful exit within ten seconds. Owned containers, volumes and the network are removed afterwards; no existing database is reused.

The existing PR image matrix retains client, server and migrations. Its server job now loads and tests the final image without publishing it. Branch protection on `main` requires the GitHub Actions checks `validate`, `characterisation`, and `build (server, apps/server/Dockerfile, .)`, including for administrators, with the branch up to date before merging. The workflow also runs for documentation-only pull requests so required checks are never omitted by path filters. Bounded SIGTERM exit is not evidence of in-flight request draining, which remains a separate migration acceptance check.

## 8. Stopping

- `Ctrl+C` stops whatever `pnpm dev` / `pnpm api` started.
- Database: `cd apps/server && docker compose stop postgres` (or `docker stop server-postgres-1`). Data survives; `docker compose down -v` is the destructive variant that also deletes the volume.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| pnpm crashes with `node:sqlite` error | Shell resolved Node 20; `nvm use 24.18` |
| `connection reset` on :3000 | Docker squats port 3000 (IPv6); the client uses 5173 on purpose |
| API errors about Postgres | Container not running (`docker compose up -d postgres` in apps/server) or migrations missing |
| `/api/*` returns 500 through the client | API not running; start it (`pnpm api`) or check `API_URL` |
| Dev SSR fails with "ESM bundle needs --experimental-vm-modules" | Run via `pnpm dev` / `pnpm dev:client` (the flag is baked into the script), not `node ssr/dev.mjs` directly |
| e2e: `browserType.launch: Executable doesn't exist` | Run the one-time `playwright install chromium` (section 6) |
| e2e: `docker compose` fails in the API webServer startup | Docker Desktop not running, or `.env` missing in apps/server (section 3) |
| e2e: click seems ignored / assertion never turns true | Test interacted before hydration — navigate with `gotoHydrated`, not `page.goto` |
| e2e: waits for API readiness and then times out | A stale API may already hold port 4000: reused servers skip DB provisioning. Stop that development session or restore its database, then rerun. |
