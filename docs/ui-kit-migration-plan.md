# UI-kit → e-commerce migration plan

> **STATUS (2026-07-06): COMPLETE.** All phases executed. The effects refactors from
> [react/effects-refactor-plan.md](react/effects-refactor-plan.md) were applied during migration
> (Navbar render-time reconciliation instead of an effect, key-based selection reset,
> route-loader data fetching; `useProduct`/`use-query` kept only for ServerStatus).
> Verified live: SSR product page with real API data, clean hydration, drawer, swatches,
> stepper, client-side navigation. This document is retained as the historical plan.

Source: `~/eduspace/ui-kit` (Vite + React 19 + Tailwind 3 + CSS Modules, FSD structure, StyleNest design system).
Target: `apps/client` in this monorepo (Rsbuild + React 19 + Tailwind 4 + TanStack Router SSR), with stories built by `apps/storybook` and the API served by `apps/server`.

Strategy: UI first, in dependency order (tokens → leaf components → composites → widgets → data/API). Every step ends green: build + storybook + lint pass before moving on.

Companion: [react/effects-refactor-plan.md](react/effects-refactor-plan.md) — per-file audit against React's "You Might Not Need an Effect", with refactors assigned to phases (Navbar effect removal → Phase 3, `key`-based selection reset → Phase 4, loaders instead of `useProduct` → Phase 5).

## What is being migrated

| Layer | Contents | Depends on |
|---|---|---|
| `shared/lib` | `cx`, `image.ts` (Supabase resize), `useMediaQuery`, `use-query` | nothing |
| `shared/ui` | star-rating, price-tag, quantity-stepper, color-swatches, size-selector, accordion, testimonial-card, image-gallery, navbar, server-status | cx, tokens; navbar → useMediaQuery; server-status → API |
| `entities/product` | types, `getProduct`, `useProduct` | shared/api |
| `widgets/product-details` | ProductDetails(Section), useProductSelection, product-display | most shared/ui + entities |
| `shared/api` | `apiGet` → `/api/*`, proxied to the Fastify server in `ui-kit/server` | running API server |

Audit results: no `window`/`document` usage in components; `useMediaQuery` is already SSR-safe (`getServerSnapshot` returns false); API usage is confined to server-status and entities/product. `use-query` fetches in `useEffect` (client-only), so SSR renders its loading state.

## Known risks / decisions

1. **Tailwind 3 → 4.** ui-kit defines tokens in `tailwind.config.js` and uses `@apply` inside CSS Modules (including a custom `.focus-ring` class). In Tailwind 4:
   - tokens move to an `@theme` block in the global stylesheet (`--color-ink`, `--color-brand`, `--font-sans`, custom `--color-gray-*` overrides, etc.);
   - each `*.module.css` that uses `@apply` needs `@reference "<global css>";` at the top;
   - `.focus-ring` must become `@utility focus-ring { ... }` in the global sheet to stay `@apply`-able.
   - Fallback if `@reference` misbehaves under Rsbuild's tailwind plugin: rewrite that module's `@apply` lines as plain CSS (tokens are available as CSS variables).
2. **Design clash.** Current `App.css` (dark gradient, white text) is the Rsbuild scaffold and will be replaced by the StyleNest light theme in Phase 1. The home page look changes.
3. **Fonts.** ui-kit imports Noto Sans via CSS `@import` from Google Fonts. With SSR we instead add `<link>` preconnect + stylesheet entries in `__root.tsx` `head()`.
4. **Conventions differ.** ui-kit enforces `T<Component>Props` type aliases, no `React.FC`, descriptive identifiers (its CLAUDE.md). Keep those conventions for migrated code; formatting/linting switches from ESLint to this repo's Biome.
5. **API server.** The Fastify API lives in this repo as `apps/server` (copied from `ui-kit/server`, renamed `@e-commerce/server`); the client talks to it over HTTP. `pnpm api:check` (biome + tsc) passes.

## Phase 0 — scaffolding (~30 min)

- Add `@` alias → `./src`: `resolve.alias` in [rsbuild.config.ts](../apps/client/rsbuild.config.ts) + `paths` in [tsconfig.json](../apps/client/tsconfig.json) (storybook and rstest inherit it through the shared config).
- Create FSD dirs under `apps/client/src`: `shared/{lib,ui,api}`, `entities`, `widgets`. Routes stay in `src/routes` (they play the "app/pages" role).
- Copy `shared/lib/cx.ts` and `shared/lib/image.ts` verbatim (no deps).
- Verify: `pnpm build`, `pnpm test`.

## Phase 1 — design foundation (~1-2 h)

- Create `src/app.css` (replaces `App.css` as the global sheet imported by `__root.tsx`):
  - `@import 'tailwindcss';`
  - `@theme` with all StyleNest tokens from `ui-kit/tailwind.config.js`: ink `#171717`, muted `#525252`, line `#e5e7eb`, surface `#f3f4f6`, brand `#4338ca` / brand-dark `#3730a3`, star `#f9cb15`, sale `#c8870c` / sale-soft `#fdf1dd`, danger `#dc2626`, gray 100-600 overrides, `--font-sans` Noto Sans stack.
  - `@utility focus-ring` port of the `.focus-ring` component class.
  - Base resets from `ui-kit/src/app/index.css` (box-sizing, font smoothing).
- Add Noto Sans `<link>` tags to `__root.tsx` `head()`.
- Keep `.content` styles for the scaffold home page temporarily (or restyle the home page now).
- Verify: SSR page renders with Noto Sans + light theme; a scratch element with `text-ink bg-sale-soft focus-ring` styles correctly; storybook builds.

## Phase 2 — leaf shared/ui components (~half day)

Copy one component at a time; each gets: `@reference` fix in its `.module.css`, a Storybook story, and (where behavior exists) an rstest test. Order:

1. `star-rating` (pure display)
2. `price-tag` (pure display)
3. `quantity-stepper` (callbacks, disabled states)
4. `color-swatches` (selection state)
5. `size-selector` (selection state)
6. `accordion` (open/close behavior — test)
7. `testimonial-card` (uses image assets: copy `img/profile-thumbnail.png` or point at remote)

Verify per component in Storybook; at the end run build + lint + tests once.

## Phase 3 — composite UI (~half day)

- `image-gallery` (thumbnails, selected image state).
- `navbar` + `icons.tsx` (uses `useMediaQuery`; verify no hydration mismatch: server renders the `false` snapshot, client may re-render — check console on `pnpm dev`).
- Replace the hand-rolled `<nav>` in [__root.tsx](../apps/client/src/routes/__root.tsx) with `Navbar`, adapting its links to TanStack Router `<Link>` (ui-kit navbar uses plain anchors; swap to `Link` for client-side nav).
- Copy `assets/navbar-e-commerce` assets into `public/` or `src/assets`.
- Verify: navigation still works SSR + client-side; mobile menu behaves after hydration.

## Phase 4 — entities + product-details widget (~half day)

- Copy `entities/product/model/types.ts` (types only, no API yet).
- Copy `widgets/product-details` (`ProductDetails`, `ProductDetailsSection`, `useProductSelection`, `product-display`).
- Temporarily drive it with a local mock `Product` fixture (lift one from ui-kit demo data / API response shape) so the widget is testable without the server.
- Add route `src/routes/products/$productId.tsx` rendering `ProductDetailsSection`; loader returns the mock for now.
- Storybook story for `ProductDetails` with the mock product (the ui-kit demo-state switcher becomes story controls: default / out-of-stock / max).
- Verify: `/products/voyager-hoodie` SSRs the full widget; hydration clean; stories pass.

## Phase 5 — API integration (~half day, needs `apps/server` running: `pnpm api`, with `.env` + Postgres via its docker-compose)

- Copy `shared/api` (`client.ts`, `users.ts`, index) and `entities/product/api` + `shared/lib/use-query.ts`.
- ~~Dev: proxy `/api/*`~~ DONE: both [ssr/dev.mjs](../apps/client/ssr/dev.mjs) and [ssr/prod.mjs](../apps/client/ssr/prod.mjs) proxy `/api/*` to `API_URL` (default `http://localhost:4000`), and root `pnpm dev` runs client + API together. Verified end to end: `GET :5173/api/v1/products/voyager-hoodie` returns the seeded product.
- SSR: switch the product route loader from mock to real fetch. Server-side it must use an absolute URL (`API_URL`), client-side relative `/api` — give `getProduct` a base-URL parameter or read from router context (same pattern as the asset lists).
- Migrate `server-status` last (pure API consumer).
- Verify: product page SSRs with real data (view-source shows product name); client navigation refetches via loader; `/api` reachable from the browser.

## Phase 6 — cleanup

- Delete scaffold leftovers: `src/App.tsx`, `.content` CSS (home page becomes a real page or a product redirect), the scaffold demo stories in `apps/storybook/stories/` once real stories exist.
- Update [README.md](../README.md) (structure section, API server requirement).
- Full pass: `pnpm build && pnpm test && pnpm run check && pnpm build-storybook`, plus manual SSR smoke (`pnpm dev`, `pnpm preview`).

## Out of scope (for now)

- `use-query` replacement with TanStack Query — router loaders cover the current needs.
- Visual-regression tooling; Storybook stories are the review surface.
