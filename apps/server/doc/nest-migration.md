# Newsletter migration boundary

Newsletter subscriptions now pass through Nest on the existing Fastify instance.
Cart, product, review and specification remain encapsulated legacy features.
Both dependency systems receive the existing singleton Postgres pool. The shared
Nest module is explicitly imported and is not global.

The controller validates with the built-in Standard Schema pipe, dispatches a
class-based command and returns the established success response with HTTP 200.
Duplicate subscriptions remain successful without publishing another event.
The dispatcher adds metadata without losing the prototype, then applies tracing
and execution timing before invoking Nest CQRS. No event subscribers were added.

Legacy Swagger observes both routing systems and health because it is registered
before routes. Newsletter currently contributes route metadata, not a second
request validator or response serializer. Complete OpenAPI generation moves in a
later migration slice.

## Telemetry compatibility

The pinned OpenTelemetry Nest integration, version 0.68.0, declares support below
Nest 12. `Nest12Instrumentation` extends only its version guard to the pinned
12.0.1 release, retaining the upstream factory and router wrappers. The live
regression checks exported HTTP, Fastify, Nest, command and event ancestry and
action correlation IDs. Revalidate this compatibility adjustment whenever either
package changes; remove it when upstream supports the pinned Nest version.

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
