# Backend Refactoring: DDD / Coupling & Cohesion Audit

Audit scope: `apps/server` (Fastify 5, TypeScript, CQRS, Awilix DI, DDD-flavored module layout).
Goal: find concrete refactoring points, not rewrite into textbook DDD.

## Structure map

**Modules** (vertical slices under `apps/server/src/modules`):

| Module | Contents | Notes |
|---|---|---|
| `product` | 1 query (`find-product`), repository + port, mapper, domain types | Read-only; no commands |
| `review` | 2 queries (`find-product-reviews`, `get-review-summary`), repository + port, mapper | Read-only; no commands |
| `user` | 1 query (`find-users`), REST + GraphQL, uses `repositoryBase` | Boilerplate remnant; unrelated to the store domain |

**Shared**: CQRS buses (`shared/cqrs`), postgres + `SqlRepositoryBase`, exceptions, DTO bases.
**Contracts**: `packages/contracts` holds the wire DTOs (TypeBox) and `compareSizes`, shared with the client.

**Dependency direction**: routes → queryBus → handlers → repository ports → SQL; enforced by dependency-cruiser rules (`.dependency-cruiser.cjs`). Verified zero cross-module imports at the code level. Routes are thin and correct (`find-product.route.ts:18-21`).

## DDD assessment

- **Where logic lives**: handlers are properly thin (`find-product.handler.ts:14-20`). Real domain rules live in the *repository*: `orderedColors`, `byColorThenSize`, `distinctSizes` (`product.repository.ts:39-76`) encode the business rule "primary colour first, variants ordered by colour then size." That is domain logic in the persistence adapter.
- **Entities/value objects**: `ProductEntity`/`ReviewEntity` are anemic read models, and **that is the right call** — this backend has no commands (outside the user remnant), so there are no invariants for rich aggregates to protect. Prices are raw `number`s (`product.types.ts:5-7`); a server-side Price VO is not currently justified since the server does no price arithmetic beyond min/max.
- **Bounded contexts**: visible and clean at the code level, **leaky at the database level**.
- **Ubiquitous language**: consistent. Minor: `discount: null` hardcoded at `product.mapper.ts:29`, a dead field carried from the external API shape.

## Coupling / cohesion assessment

- **product**: high cohesion except the repository, which mixes SQL, row mapping, and ordering rules (three reasons to change). It also reaches across the context boundary, querying `product_reviews` directly (`product.repository.ts:91-94`).
- **review**: cohesive, but duplicates the review-summary aggregation that product also computes (`review.repository.ts:87-97` vs `product.repository.ts:91-94`) — **two sources of truth for "average rating."** It also reaches into product's table for `productExists` (`review.repository.ts:33-37`), and that check is duplicated in both review handlers (`find-product-reviews.handler.ts:21-23`, `get-review-summary.handler.ts:18-20`).
- **user + shared/db base**: the user module is the only consumer of `repositoryBase`/`SqlRepositoryBase` and the GraphQL plugin. Product and review rightly hand-roll their aggregate queries, so this generic CRUD machinery (`sql-repository.base.ts`) exists to serve a module with no domain purpose.
- **Convention drift**: `shared/ddd/mapper.interface.ts` declares `toPersistence/toDomain/toResponse`, but product and review mappers implement only `toResponse`; row→entity mapping is inlined in repositories. The docs describe a convention the real modules do not follow.

## Findings and refactoring candidates (ranked)

| # | Smell | Evidence | Refactoring (catalog) | Payoff | Effort |
|---|---|---|---|---|---|
| 1 | Duplicated domain query (review summary computed in two contexts) | `product.repository.ts:91-94` vs `review.repository.ts:87-97` | Remove Duplication: `find-product.handler` executes `getReviewSummaryQuery` via the queryBus; drop the SQL from product repo | Single source of truth for ratings; honors module boundaries the buses exist for | M |
| 2 | Domain logic in persistence adapter | `product.repository.ts:39-76` (`orderedColors`, `byColorThenSize`, `distinctSizes`) | Move Function → `product/domain/product.ordering.ts` | Repository becomes mechanical; ordering rules unit-testable without the fake db | S |
| 3 | Dead-weight module + oversized shared base | `modules/user/*` (357 lines), `sql-repository.base.ts`, gql plugin | Remove Dead Code / Collapse Hierarchy: delete/quarantine user module and the now-unused `repositoryBase` (continues commit 054fec0's direction) | Large cohesion win; shared/ surface shrinks to what real modules use | M |
| 4 | Duplicated guard clause | `find-product-reviews.handler.ts:21-23` and `get-review-summary.handler.ts:18-20` | Extract Function (`ensureProductExists`) in review module | One place for the not-found rule | S |
| 5 | Docs/interface vs practice drift | `mapper.interface.ts` vs `product.mapper.ts` / `review.mapper.ts` | Extract Move (row mapping → mapper `toDomain`) or amend AGENTS.md to bless response-only mappers for read models | Convention and code stop contradicting each other | S |
| 6 | Dead field | `product.mapper.ts:29` `discount: null` | Remove Dead Code (needs contracts change; client is a consumer) | Minor clarity | S |

**Explicitly fine as-is**: anemic read models (no writes to protect), `productExists` via EXISTS query (cheaper than executing the full `findProductQuery`), hand-rolled aggregate SQL instead of the repository base (correct choice for multi-table reads).

**Overall verdict**: the architecture is genuinely good for its size; the leaks are at the DB boundary and inside the product repository, not in the layering.

### Top priority order

1. **#2** (ordering logic → domain) — smallest risk, pure-function extraction, worst cohesion offender.
2. **#1** (unify review summary via queryBus) — the only finding with real change-pain today; demonstrates the cross-module pattern the docs describe but the code doesn't yet use.
3. **#3** (retire user module + repositoryBase) — mechanical but broad; finishes what commit 054fec0 started.
4. **#4, #5, #6** — opportunistic.

---

# Refactoring Plan

Ordered, independently shippable sub-tasks. Existing safety net: `product.repository.spec.ts` pins repository behavior with a fake db; updated in place at exactly two points below, never rewritten.

## Task 1 (F2, step 1): Extract ordering rules into the domain layer
- **Goal**: create pure ordering functions in the domain with their own spec; repository untouched.
- **Files**: new `modules/product/domain/product.ordering.ts` (move `orderedColors`, `byColorThenSize`, `distinctSizes`); new `modules/product/domain/product.ordering.spec.ts`.
- **Details**: generalize signatures to domain shapes (`{ color: string }[]` instead of `InventoryRow`/`ImageRow`) so no DB row types leak into `domain/`. The new spec ports the three ordering cases from the fake-db spec as direct pure-function tests. `compareSizes` stays imported from `@e-commerce/contracts` (shared kernel, allowed).
- **Depends on**: nothing.
- **Done-check**: `node --test src/modules/product/domain/product.ordering.spec.ts` passes; `pnpm check` and `pnpm deps:validate` green (proves domain→database direction is clean).
- **Catalog**: Move Function (phase 1: duplicate + test).

## Task 2 (F2, step 2): Rewire the repository to the domain functions
- **Goal**: repository imports the domain functions; local copies at `product.repository.ts:39-76` deleted.
- **Files**: `product.repository.ts` only.
- **Characterization**: none to add; the existing fake-db spec's ordering tests are the net and must pass **unmodified**.
- **Depends on**: Task 1.
- **Done-check**: `pnpm check` green with zero edits to `product.repository.spec.ts`.
- **Catalog**: Move Function (phase 2: redirect + remove).

## Task 3 (F1, step 1): find-product handler composes the review summary via queryBus
- **Goal**: handler executes `getReviewSummaryQuery` and merges `{ count: summary.total, average: summary.average }` into the entity; repo's inline summary becomes overwritten (still present, harmless, removed next task).
- **Files**: `modules/review/index.ts` (re-export `getReviewSummaryQuery` as the module's public API); `modules/product/queries/find-product/find-product.handler.ts`; new `find-product.handler.spec.ts` with a fake `queryBus` and fake `productRepository` pinning the composed result.
- **Depends on**: decision D1.
- **Done-check**: new handler spec passes; `pnpm check`, `pnpm deps:validate`, and `pnpm test:e2e` green.
- **Catalog**: Move Method / Remove Duplication (phase 1: new path first).

## Task 4 (F1, step 2): Drop the review-summary SQL from the product repository
- **Goal**: remove the `product_reviews` query at `product.repository.ts:91-94`; repository returns the product without `reviews`.
- **Files**: `product.repository.ts`; `product.repository.port.ts` (return type becomes `Omit<ProductEntity, 'reviews'>`); `product.repository.spec.ts` **updated, not rewritten**: remove `product_reviews` from `TABLES`/rows and drop only the `reviews` assertion inside the "maps images, info, and the review summary" test; handler spec from Task 3 adjusts its fake repo shape.
- **Depends on**: Task 3.
- **Done-check**: `pnpm check` green; fake-db spec still passes with the two-line update; e2e green.
- **Catalog**: Remove Duplication (phase 2: delete old path).

## Task 5 (F3, step 1): Delete the user module and its GraphQL surface
- **Goal**: remove `modules/user/**` (357 lines), the GraphQL plugin, and user-related test/scripts.
- **Files**: `modules/user/` (all); `server/plugins/gql.ts` + its registration in `server/index.ts`; `tests/user/**` (cucumber + k6); `package.json` scripts (`db:seed:users`) and now-unused GraphQL deps.
- **Precondition to verify in-task**: `gql.ts` has no consumer other than `find-users.resolver.ts` (assumption A1).
- **Depends on**: nothing (independent of Tasks 1-4).
- **Done-check**: `pnpm check`, `pnpm deps:validate`, `pnpm test:e2e` green; `/api/v1/products/:id` and review routes still respond (swagger lists no user routes).
- **Catalog**: Remove Dead Code.

## Task 6 (F3, step 2): Remove the now-orphaned generic repository machinery
- **Goal**: delete `SqlRepositoryBase` and the `repositoryBase` DI registration.
- **Files**: `shared/db/sql-repository.base.ts`; `modules/index.ts` (drop `repositoryBase` from `Dependencies` and `makeDependencies`); `shared/ddd/mapper.interface.ts` loses its only consumer, mark for Task 8's decision rather than deleting here.
- **Depends on**: Task 5.
- **Done-check**: `pnpm check` and `pnpm deps:validate` green.
- **Catalog**: Remove Dead Code / Collapse Hierarchy.

## Task 7 (F4): Extract the productExists guard
- **Goal**: single `ensureProductExists(reviewRepository, productId)` used by both review handlers.
- **Files**: new `modules/review/queries/ensure-product-exists.ts` (application layer, beside the handlers); `find-product-reviews.handler.ts:21-23`; `get-review-summary.handler.ts:18-20`.
- **Depends on**: Tasks 3-4 (avoids editing the same handlers concurrently).
- **Done-check**: `pnpm check` green; e2e review scenarios (404 for missing product) green.
- **Catalog**: Extract Function.

## Task 8 (F5): Align the documented mapper convention with reality
- **Goal**: amend AGENTS.md to bless response-only mappers for read models; decide whether `mapper.interface.ts` shrinks to `toResponse` or is deleted (dead after Task 6).
- **Files**: `apps/server/AGENTS.md`; optionally `shared/ddd/mapper.interface.ts`.
- **Depends on**: Task 6 (the interface's fate is only clear once its consumer is gone).
- **Done-check**: `pnpm check` green.
- **Catalog**: documentation alignment (no code smell name applies).

## Task 9 (F6): Remove the dead `discount` field (decision-gated)
- **Goal**: drop `discount: null` from `product.mapper.ts:29` and `inventoryItemDtoSchema` in `packages/contracts/src/product.ts`.
- **Precondition in-task**: search `apps/client` for reads of `discount` (distinct from `discount_percentage`); if the client reads it, stop and keep the field.
- **Files**: `packages/contracts/src/product.ts`; `product.mapper.ts`; any client type fallout.
- **Depends on**: decision D3.
- **Done-check**: `pnpm check` in **both** `apps/server` and `apps/client`; client test suite green.
- **Catalog**: Remove Dead Code.

## Risks & open questions

**Risks**
- **Task 3 changes find-product's query profile**: previously 5 queries in the product repo; afterwards 4 there plus the summary handler's `productExists` EXISTS check and summary aggregate, net 6. Accepted tradeoff for a single source of truth.
- **Task 3 sets the cross-module precedent**: the handler imports the *action creator* from `review/index.ts`. That is still a code-level import between modules; the plan treats a module's `index.ts` re-exports as its public API. If dependency-cruiser is later tightened to forbid cross-module imports entirely, action-creator contracts would need to move to a shared location.
- **Task 4 type surgery**: `Omit<ProductEntity, 'reviews'>` on the port is the minimal change; a dedicated `ProductRecord` type would touch more files. Revisit only if it spreads.
- **Task 5 blast radius**: cucumber step definitions and k6 scripts may share helpers with non-user tests (`tests/support/server.ts` stays). Verify nothing else imports from `tests/user/`.
- **Race semantics, Task 3**: if a product is deleted between the product fetch and the summary query, `getReviewSummary` throws NotFound where the old code returned zeros. Practically unreachable (no delete path exists), noted for honesty.

**Decisions needed before starting**
- **D1 (before Task 3)**: confirm that importing `getReviewSummaryQuery` from `review/index.ts` is the blessed cross-module contract style. Alternative: move shared action creators into `shared/`, heavier and not recommended at this size.
- **D2 (before Task 5)**: confirm the GraphQL endpoint is not consumed by anything external (no client code hits `/graphql`; only the user module resolves through it).
- **D3 (before Task 9)**: confirm the client does not read `discount`; also confirm willingness to diverge from the external GreatFrontend API shape that field mirrors. If parity with that API matters, skip Task 9 entirely.

**Assumptions flagged**
- A1: `gql.ts` serves only `find-users.resolver.ts`.
- A2: the `users` DB table and its migrations stay (data removal is out of scope; only code dies).
- A3: `review_authors` is unrelated to the user module (it joins reviews, not users), so Task 5 does not touch the review SQL.
