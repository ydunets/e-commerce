# Nest runtime acceptance

All five storefront features now run through Nest on the existing Fastify instance.
Each feature imports the non-global SharedModule explicitly. Configuration is parsed
once, and all repositories share the existing singleton Postgres pool.

## Feature and query composition

Controllers validate requests through the built-in Standard Schema pipe, dispatch
typed commands or queries, and map responses with plain functions. Explicit HTTP
200 decorators preserve successful POST outcomes. Duplicate newsletter subscriptions
remain successful without publishing another event.

Product details dispatch GetReviewSummaryQuery; cart additions and updates dispatch
GetInventoryStockQuery. Each query has one decorated Nest handler. The dispatcher
preserves action prototypes, existing correlation IDs and timestamps, then applies
tracing and execution timing. Nested queries have their own spans and successful
timing records. No legacy query bridge, custom bus registration or container remains.

Cart identity, current-price reads, summed quantities, coupon order and stock-conflict
details are unchanged. Reconciliation applies clamps and removals in one transaction.
The existing read-then-write stock trade remains deliberate; row locking, reservation,
checkout and authentication are outside this migration.

## Validation and documentation

Nest Swagger serves the UI at /api-docs and OpenAPI 3.0.0 at /api-docs/json.
Standard Schemas describe requests and successful responses. The named ApiErrorResponse
component is exported through the contract's native Standard JSON Schema interface.
Fastify health is documented explicitly because Nest does not discover its route.

Preprocessing preserves accepted scalar conversions without making absent identifiers
into strings. Required request fields are explicit schema metadata where preprocessing
obscures requiredness to documentation. Unknown fields are accepted without strict
rejection; errors retain their envelope and JSON Pointer paths. No runtime response
serializer or response-validation interceptor is installed.

ReviewsPageResponseDto remains a hand-written interface; its companion schema serves
documentation. The database-free document regression checks all business paths,
metadata, bounds, examples, nested references, UI assets and unchanged validation and
response behavior. The legacy Swagger converter and packages, application-owned
TypeBox/Ajv dependencies and unused generated-client tooling have been removed.
Fastify still retains its own transitive validation dependencies.

## Telemetry compatibility

The pinned OpenTelemetry Nest integration, version 0.68.0, declares support below
Nest 12. `Nest12Instrumentation` extends only its version guard to the pinned
12.0.1 release, retaining the upstream factory and router wrappers. The live
regression checks exported HTTP, Fastify, Nest, command and event ancestry and
action correlation IDs. Revalidate this compatibility adjustment whenever either
package changes; remove it when upstream supports the pinned Nest version.

`telemetry-compatibility.spec.ts` compares both installed packages and manifest pins
against the verified versions during `pnpm check`. A version change fails with
revalidation instructions. Run the live characterisation suite and production image
smoke gate before updating the verified pair, then review whether the upstream
version guard still requires the adapter. The test also verifies that the adapter
preserves the upstream file list and extends only the verified Nest version.

## Shutdown

Nest handles SIGTERM and SIGINT and exits only after adapter disposal. Fastify
owns pool closure. Responses already active when shutdown begins complete with
`Connection: close`, preventing a keep-alive socket from outliving the initial
idle-connection sweep. There is no competing pool disposer or early exit handler.

The live regression blocks a real subscription INSERT with a Postgres table lock,
signals the application, verifies that the pool remains open, releases the lock,
and verifies the successful response, persisted row and exactly one pool close.
The production image gate independently verifies bounded container shutdown.

## Verification

Run `pnpm check` from the workspace root for database-free validation. With a
migrated and seeded test database, run
`pnpm --filter @e-commerce/server test:characterisation`; this includes the
compiled HTTP suite and isolated live tracing/draining regression. Run the
production image build and `apps/server/scripts/smoke-image.mjs` as documented in
the workspace runbook.

Architecture validation runs within `pnpm check` through `check:architecture`.
Controllers belong to the API layer, and handlers cannot import persistence
implementations or shared database helpers. Repository port imports remain allowed.
A fixture-based dependency cruise verifies both rejected and permitted imports.


## Delivery boundary

Issues #96 and #97 complete application migration and documentation only. The parent
specification remains open. Digest-based deployment, readiness verification and the
two recovery branches remain the separate acceptance work in #98.
