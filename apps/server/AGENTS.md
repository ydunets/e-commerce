# AGENTS.md

> Instructions for AI coding assistants (Cursor, Claude Code, GitHub Copilot, etc.)

## Project overview

A Nest 12 application on Fastify 5 using Clean Architecture, CQRS, and DDD.
TypeScript strict mode and compiled ESM on Node 24.18.0. SWC emits application and test code; TypeScript performs strict no-emit checking.

## Quick reference

Run the commands below from `apps/server`. From the workspace root, use
`pnpm --filter @e-commerce/server <script>`; root `pnpm check` validates the whole workspace.
Consult [package.json](package.json) for the current script definitions.

| What | Where |
|---|---|
| Package manager | `pnpm` (never npm or yarn) |
| Linter + formatter | oxlint + oxfmt |
| Validation after changes | `pnpm check` (lint, formatting, types, compiled unit/runtime tests and architecture) |
| Auto-fix formatting | `pnpm format` |
| Unit tests | `pnpm test:unit` (node:test) |
| Characterisation tests | `pnpm test:characterisation` (Cucumber + Gherkin) |
| Architecture validation | `pnpm deps:validate` (dependency-cruiser) |
| DB migrations | `pnpm db:migrate` (DBMate) |

Run `pnpm check` after changes. If formatting fails, format only the files owned by
the task with `pnpm format <paths>`, then rerun the check.

## Architecture

### Runtime architecture

All five features are Nest modules: newsletter, product, review, specification and cart.
Import the non-global SharedModule explicitly for configuration, the singleton pool
and ApplicationDispatcher. Controllers validate Zod contracts through the built-in
Standard Schema pipe, dispatch typed commands or queries, and map responses with
plain functions. Nest CQRS discovers decorated handlers registered as providers.
Preserve command/query prototypes when enriching metadata.

Product details query review summaries, and cart additions/updates query inventory,
through ApplicationDispatcher. Cross-feature imports target query contracts, not
feature modules, repositories or handlers. Each nested query has its own correlated
span and successful execution timing record.

Nest owns signal handling. Fastify drains active requests and closes the shared
pool exactly once. For bootstrap, telemetry, validation or lifecycle changes, read
[the runtime acceptance guide](doc/nest-migration.md) and run its live and image gates.

### API documentation

Nest Swagger serves OpenAPI 3.0.0 at /api-docs/json and the UI at /api-docs.
Parameter decorators expose Standard Schemas; ApiContract documents successful
responses and errors without installing runtime serialization or output validation.
The directly mounted Fastify health route is documented explicitly. Keep required
input fields explicit in Zod metadata when preprocessing obscures their requiredness.
ReviewsPageResponseDto remains a hand-written public interface.

### Layer boundaries (CRITICAL)

The dependency flow is strictly **inward**: `Route → Handler → Domain → Repository`.

```
src/
├── instrumentation.ts ← OpenTelemetry setup (loaded via --import before the app)
├── modules/         ← Feature code (vertical slices)
│   └── <feature>/
│       ├── commands/ ← State-changing operations
│       ├── queries/  ← Data-retrieval operations (idempotent)
│       ├── database/ ← Repository port (interface) + adapter (implementation)
│       ├── domain/   ← Business logic, types, errors
│       └── dtos/     ← Shared response schemas
├── server/          ← Fastify setup, plugins, DI wiring
└── shared/          ← Cross-cutting: CQRS, DB, exceptions, utils
```

**Never** import from `src/shared/db/` or `database/` inside handler files.
Handlers interact with data exclusively through repository ports (interfaces).
SQL belongs in repository files only.

### Module independence

Modules should avoid importing directly from other modules. Cross-module communication
uses the CQRS buses:
- Commands/queries for request-response
- Events for fire-and-forget notifications

Known exception: the review module checks product existence with direct SQL against
`products` (`review.repository.productExists`) to avoid a bus round-trip on the hot
path. New modules should default to bus queries for cross-module reads.

## Nest provider conventions

Use class-based commands and queries with descriptive action types and optional
metadata. Handlers implement the appropriate Nest CQRS interface and receive
repository interfaces through described symbol tokens. Concrete Postgres adapters
are feature-local providers. Register handlers in their feature module.

The dispatcher owns correlation, timestamps, tracing and timing. Preserve existing
metadata and prototypes; use its execute, query and publish methods rather than
invoking raw Nest buses from feature code. Event publication is fire-and-forget,
without an implied delivery guarantee or new subscribers.

## Database

- Client: `postgres` (postgres.js) — uses tagged template literals for parameterized queries
- Connection: lazy singleton via `getDb()` in `src/shared/db/postgres.ts`; close with `closeDbConnection()`
- Migrations/seeds: DBMate (SQL files in `db/migrations/` and `db/seeds/`)
- Transaction support: call the injected database's `begin(async (tx) => { ... })`; cart reconciliation applies all changes within that transaction.
- Repositories are hand-written per module (no generic base) — each repository port declares only the queries its module needs, and the adapter issues its own SQL and maps rows directly to domain shapes
- Mappers are hand-written per module too: for read-only modules (no commands), a mapper only needs `toResponse(entity): ResponseDto`; add `toDomain`/`toPersistence` only if the module actually writes to the database
- The `users` table and its seed are an unused placeholder for a future auth context; no application code references them
- `product_reviews.user_id` has no FK to `review_authors` on purpose (dbmate applies all migrations before any seeds, and the products seed inserts reviews before the authors seed runs); the reviews repository LEFT JOINs with a `COALESCE` display-name fallback, and `CHK_reviews_rating` / `CHK_features_icon` guard row invariants instead
- Small, stable reference data (e.g. `collections`, `categories`) takes the opposite trade: the rows are embedded in the table's own migration, which makes FKs from seeded tables safe under the same migrations-before-seeds ordering, on fresh and already-seeded databases alike. Prefer this for closed sets of a few rows; prefer the no-FK pattern above when the parent data itself lives in a seed

SQL parameterization rules:
- Always use tagged templates: `` db`SELECT * FROM ${db(tableName)} WHERE id = ${id}` ``
- Table names use `db(tableName)` (identifier interpolation)
- Values use `${value}` (parameterized automatically)
- Condition composition uses `joinConditions()` from `src/shared/db/postgres.ts`

## Coding conventions

### Style
- Follow the workspace [oxfmt configuration](../../.oxfmtrc.jsonc) and the server
  [oxlint configuration](.oxlintrc.json), which extends the workspace rules.
- File naming: `kebab-case` only (enforced by oxlint's `unicorn/filename-case`)
- No enums — use `const` objects with derived types (e.g. `UserRoles`)
- Keep pure domain logic functional. Nest controllers, handlers and repository adapters use classes.
- Use explicit types; oxlint's `typescript/no-explicit-any` is an error, with test overrides in the workspace configuration.
- No `console` — use the injected `logger` (Pino)

### TypeScript
- `strict: true` with `noImplicitAny: true`
- Use extensionless `#src/*` and `#tests/*` aliases. The `development` condition resolves source for checking; runtime defaults resolve compiled JavaScript. Runtime commands must omit `--conditions=development`.
- Use `.js` extensions for relative ESM imports, including in TypeScript source.
- Use type-only imports for erased types, but retain runtime imports for constructor dependencies whose classes must appear in decorator metadata. Verify these imports through compiled application initialization.
- Build contracts before the server. Use the manifest's build, test and development commands to preserve output cleaning, metadata preload and watcher startup ordering. See `../../docs/runbook.md` for execution and image verification.

### API
- Business controllers declare the established `api/v1` prefix.
- Request schemas and shared response contracts use Zod; the Standard Schema pipe validates requests.
- Routes handle HTTP concerns only — no business logic in routes

### Testing
- Unit/integration tests: `*.spec.ts` files next to source, using `node:test` with `describe`/`it`/`assert`
- Characterisation tests: Cucumber features in `tests/`, step definitions in `tests/<feature>/`, exercising HTTP through `inject()`
- E2E tests: Playwright browser tests in the workspace's `apps/e2e` package
- Load tests: k6 scripts in `tests/<feature>/`
- Test server: use `buildApp()` from `tests/support/server.ts`, which initializes the Nest/Fastify application without listening.

### Exceptions
- Domain errors extend `ExceptionBase` (in `src/shared/exceptions/`)
- Built-in exceptions: `NotFoundException`, `ConflictException`, `DatabaseErrorException`, `ArgumentInvalidException`, `InternalServerErrorException`, `ProviderErrorException`
- Always include a descriptive message: `throw new NotFoundException('User with id X not found')`

## Verification

Retain the existing domain, mapper, handler and repository behavior specifications.
Construct handlers and repositories directly with complete typed port fakes.
Test HTTP behavior through the initialized application's inject seam, with serial,
isolated database fixtures. Use compiled runtime tests for provider resolution,
documentation semantics, validation, configuration and telemetry compatibility.
Run workspace checks, database-backed characterisation and the production image
smoke gate before declaring a runtime migration complete.

## Common mistakes to avoid

- Importing DB/infrastructure code in handlers (violates architecture boundaries)
- Supplying manual dispatcher result types instead of inferring them from the command or query
- Mutating action metadata or discarding its prototype during enrichment
- Using source extensions or development resolution in runtime imports
- Using `npm` or `yarn` instead of `pnpm`
- Using `console.log` instead of the injected Pino `logger`
- Adding `enum` types (use const objects + derived types)
- Putting business logic in route files
- Importing another feature's internals instead of its query contract
