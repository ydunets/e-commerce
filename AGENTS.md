# AGENTS.md

You are an expert in JavaScript, Rsbuild, and web application development. You write maintainable, performant, and accessible code.

## Repository layout

pnpm workspace. Packages live in `apps/`:

- `apps/client` — `@e-commerce/client`: React 19 + TanStack Router SSR on Rsbuild
- `apps/server` — `@e-commerce/server`: Fastify API (has its own AGENTS.md — read it before touching server code)
- `apps/storybook` — `@e-commerce/storybook`: Storybook for client components (stories co-located in `apps/client/src`)

## Commands (repo root)

- `pnpm dev` - Start the full stack: client SSR dev server (5173, proxies /api/*) + Fastify API (4000, needs Postgres)
- `pnpm dev:client` - Client SSR dev server only (5173)
- `pnpm build` - Build the client for production
- `pnpm preview` - Serve the client production build
- `pnpm test` - Run client tests (rstest)
- `pnpm check` - Run ALL checks in all packages concurrently (client biome+tsc+rstest, server biome+tsc+unit tests, storybook build). Use this to validate changes.
- `pnpm check:client` - Client checks only
- `pnpm storybook` - Start Storybook (port 6006)
- `pnpm api` - Start the Fastify API (needs `.env` and Postgres)
- `pnpm api:check` - Server biome + tsc

Use `pnpm --filter @e-commerce/<name> <script>` for anything else.

## Docs

- Full run guide (prereqs, database, all run modes, troubleshooting): docs/runbook.md
- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt
- Rstest: https://rstest.rs/llms.txt

## Notes

- Node >= 24 required (pnpm 11 breaks on Node 20).
- Client conventions for migrated ui-kit code: `T<Component>Props` type aliases, no `React.FC`, descriptive identifiers. See docs/ui-kit-migration-plan.md.
- Effect discipline: derive during render, reset via `key`, fetch via route loaders, `useSyncExternalStore` for subscriptions. Rules and per-file plan: docs/react/.
