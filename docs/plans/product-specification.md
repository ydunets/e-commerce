# Product Specifications: backend integration plan

Status: awaiting approval (open decisions 1-3 below)
Scope: replace the static content module `apps/client/src/widgets/product-specifications/lib/specifications.ts` with data served by `apps/server`.

## Approach summary

Introduce a new `specification` vertical slice in `apps/server`, mirroring the `product` module file-for-file, exposed as `GET /api/v1/specifications`, with schema and seed shipped through the existing dbmate + Container Apps Job pipeline (zero pipeline changes: new SQL files ride along in the job image).

**Data model recommendation: a shared, product-independent catalog block, not per-product rows.** The content ("Discover timeless elegance", baby-cashmere copy) is collection-wide marketing identical on every product page; per-product modeling (like `product_info`) would force fabricating 4 x 23 duplicate rows for products the copy is not about. A junction table (`product_specifications`) can be added later without breaking anything if a future challenge makes it per-product. The tradeoff: one extra migration later vs. fake data now.

Icons travel as a typebox union of 16 kebab-case keys (`'recycle-line' | ...`) defined once in `@e-commerce/contracts`; the client maps key to component in an exhaustive, type-checked record. The widget flips from importing static data to receiving `specifications` as a prop from the route loader (same "data flows down" shape as `ProductDetailsSection`), so the lazy-panel-mount behavior is untouched.

## Sub-tasks

### T1: Contract schemas (no dependencies)

- Goal: shared DTO + icon-key union both apps compile against.
- Files: `packages/contracts/src/specification.ts` (mirrors `product.ts`): `SPECIFICATION_ICONS` const tuple, `specificationIconDtoSchema` as `Type.Union` of literals, `specificationFeatureDtoSchema`, `specificationResponseDtoSchema` with snake_case fields (`specification_id`, `label`, `title`, `description`, `image_url`, `image_alt`, `features[]`); export block in `packages/contracts/src/index.ts`.
- Done-check: `pnpm check` in contracts; types importable from both apps.

### T2: Migration + seed (no dependencies; shippable before any code)

- Goal: tables exist and are populated in every environment the Job touches.
- Files:
  - `pnpm db:create-migration create_specification_tables` -> `apps/server/db/migrations/<ts>_create_specification_tables.sql` (mirrors `20260622181427_create_product_tables.sql`):
    - `specifications`: `specification_id` varchar PK, `label`, `title`, `description` text, `image_url`, `image_alt`, `sort_order` int, `created_at`; plus `-- migrate:down`.
    - `specification_features`: SERIAL PK, FK to `specifications` with `ON DELETE CASCADE`, `icon`, `label`, `sort_order`.
  - `pnpm db:create-seed specifications` -> `apps/server/db/seeds/<ts>_specifications.seed.sql` (mirrors `20240601000000_products.seed.sql`): 4 specs + 16 features hand-written from the current static module; image paths `/images/specifications/*.jpg` as-is.
- Done-check: `pnpm db:migrate && pnpm db:seed` locally; `db/entrypoint.sh` re-run is a no-op (dbmate tracks seeds in `schema_migrations`).

### T3: Server module (depends on T1, T2)

- Goal: `GET /api/v1/specifications` returns the seeded content, validated against the contract schema.
- Files (each mirrors the named `product` sibling):
  - `src/modules/specification/index.ts`: `actionCreatorFactory('specification')` + `declare global` Dependencies (mirrors `product/index.ts`)
  - `domain/specification.types.ts`: camelCase `SpecificationEntity` (mirrors `product.types.ts`)
  - `database/specification.repository.port.ts`: `findAll(): Promise<SpecificationEntity[]>` (mirrors `product.repository.port.ts`)
  - `database/specification.repository.ts`: two tagged-template queries ordered by `sort_order`, features grouped per spec (mirrors `product.repository.ts`)
  - `dtos/specification.response.dto.ts`: re-export from contracts (mirrors `product.response.dto.ts`)
  - `specification.mapper.ts`: `toResponse` only, read-only module (mirrors `product.mapper.ts`)
  - `queries/list-specifications/list-specifications.handler.ts`: `listSpecificationsQuery`, no NotFound path (a list can be empty) (mirrors `find-product.handler.ts`)
  - `queries/list-specifications/list-specifications.route.ts`: `GET /v1/specifications`, `200: Type.Array(specificationResponseDtoSchema)`, tag `specifications` (mirrors `find-product.route.ts`; no params, so no `.schema.ts` file)
- DI/wiring: none beyond the module `index.ts`; repository/mapper/handler are picked up by the Awilix autoload filename conventions.
- Done-check: `pnpm check` + `curl localhost:4000/api/v1/specifications` returns 4 specs; Swagger shows the route.

### T4: Server tests (depends on T3)

- Goal: pin repository SQL behavior and handler wiring.
- Files:
  - `database/specification.repository.spec.ts`: fakeDb tagged-template pattern from `product.repository.spec.ts` (shuffled rows in, sorted-by-`sort_order` entities with grouped features out)
  - `queries/list-specifications/list-specifications.handler.spec.ts`: mock port, asserts registration type and passthrough, plus empty-list case (mirrors `find-product.handler.spec.ts`)
- Done-check: `pnpm test:unit` green.

### T5: Client entity (depends on T1; shippable while T3 is in review)

- Goal: typed fetch + domain mapping + fixture, mirroring `entities/product`.
- Files: `apps/client/src/entities/specification/model/types.ts` (camelCase `Specification`), `api/getSpecifications.ts` (`apiGet<SpecificationResponseDto[]>('/v1/specifications', baseUrl)` + snake-to-camel mapping, mirrors `getProduct.ts`), `model/specification.fixture.ts` (mirrors `product.fixture.ts`, content copied from today's static module), `index.ts`.
- Done-check: `pnpm check` in client.

### T6: Widget switch-over (depends on T3 + T5)

- Goal: section renders API data; static module deleted.
- Files:
  - `widgets/product-specifications/ui/ProductSpecificationsSection.tsx`: accept `specifications: Specification[]` prop (mirrors `ProductDetailsSection` receiving `product`)
  - new `widgets/product-specifications/lib/icon-map.ts`: exhaustive `Record<SpecificationIcon, ComponentType>` over the existing `ui/icons.tsx`
  - delete `lib/specifications.ts`
  - `routes/products/$productId.tsx` loader -> `Promise.all([getProduct(...), getSpecifications(...)])`
  - stories pass the fixture
- Lazy-mount note: no behavior change. Data is loader-resolved before first render, so `visitedIds` lazy mounting and the shared Tabs component are untouched.
- Done-check: `pnpm check`; page renders all 4 tabs from the API (verified via dev servers); stories render offline from the fixture.

## Risks and open questions

1. **Shared vs per-product (blocks T2 schema).** Recommendation: shared. Switching to per-product later means adding a junction table, not rewriting.
2. **Section heading/intro.** Plan keeps "Discover timeless elegance" + intro paragraph static in the widget and serves only the tabs (the challenge names tab content as the dynamic part). Alternative: a singleton `specification_section` table.
3. **Loader failure coupling.** `Promise.all` means a specifications outage fails the whole product page. Recommendation: catch in the loader and pass `null`, then skip rendering the section (marketing content should not take down the PDP).
4. **Icon key safety.** The contracts union is the single source of truth; server response validation rejects unknown keys at the boundary, and the client map is compile-time exhaustive. No DB CHECK constraint (repo convention keeps validation at the API layer).
5. **Image hosting.** Seeds store client-served `/images/specifications/*.jpg` paths; the server returns paths it does not host. Consistent with today, but worth revisiting if assets ever move to blob storage like the collections images.
