# StyleNest storefront API

The storefront API runs on Nest 12.0.1 with Fastify 5.12.1, compiled ESM and Node
24.18.0. Its five feature modules serve products, reviews, specifications,
newsletter subscriptions and the complete anonymous cart lifecycle.

## Run the application

Follow the [workspace runbook](../../docs/runbook.md) for installation, database
configuration and each execution mode. Commands below run from the repository root.

```bash
pnpm install
pnpm api
pnpm build
pnpm --filter @e-commerce/server start:prod
```

Development builds contracts and server code before starting the SWC and Node
watchers. Production executes compiled JavaScript and receives environment variables
from its platform. Optional local environment files are loaded before instrumentation
in development and tests; explicit environment variables take precedence.

## Public API

Business endpoints retain the /api/v1 prefix. Product listing and details, review
listing and summaries, specifications, newsletter subscriptions and seven cart
operations are documented at /api-docs. The JSON document is available at
/api-docs/json and uses OpenAPI 3.0.0. The /health route checks PostgreSQL.

Shared Zod contracts provide request validation, response documentation and client
DTOs. Nest Swagger consumes Standard Schemas; mappers determine runtime responses.
There is no generated client package or response-validation interceptor.
ReviewsPageResponseDto remains a hand-written interface.

Cart identity is issued only after a successful first add. Lines use current
inventory prices, quantities for the same inventory item are combined, and the
cart count sums quantities. Coupon behavior, stock-conflict details and transactional
stock reconciliation retain the existing [cart](../../docs/adr/0002-server-side-anonymous-cart.md)
and [stock](../../docs/adr/0003-mutating-stock-validation.md) decisions.

## Architecture

Controllers handle HTTP concerns and dispatch decorated command/query classes.
Handlers depend on symbol-token repository interfaces; concrete Postgres adapters
retain hand-written SQL. Domain functions and response mappers remain plain functions.
Each feature imports the non-global SharedModule explicitly.

Product details compose review summaries, while cart mutations query inventory,
through ApplicationDispatcher. The dispatcher preserves action prototypes and
metadata and owns correlated tracing and execution timing. Nest CQRS owns handler
registration. The legacy container, autoloaders and query bridges have been removed.

Nest owns signals. Fastify drains active requests and closes the shared database
pool exactly once. Read the [runtime acceptance guide](doc/nest-migration.md) before
changing bootstrap, telemetry or shutdown.

## Verification

```bash
pnpm check
pnpm --filter @e-commerce/server test:characterisation
docker build -f apps/server/Dockerfile -t e-commerce-server:local .
node apps/server/scripts/smoke-image.mjs e-commerce-server:local
```

Workspace checks are database-free and include lint, types, retained behavior tests
and architecture validation. Characterisation requires an isolated migrated and
seeded database, covers all 13 business endpoints, and includes live tracing and
in-flight request draining. The image gate provisions its own database and verifies
the final non-root artifact, documentation, startup and bounded signal exit.

The existing PR image matrix and release workflow remain in place. Completing the
application migration does not verify digest-based deployment or recovery; that
work remains scoped to issue #98. See [AGENTS.md](AGENTS.md) for coding conventions.

## Attribution

The application originated from Marco Turi's Fastify boilerplate. Its MIT licence
and existing attribution remain applicable.
