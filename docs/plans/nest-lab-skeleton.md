# Nest lab: walking-skeleton plan

Status: approved (four grilling rounds settled; see [ADR 0004](../adr/0004-nest-lab-owns-its-zod-contracts.md))
Scope: add `apps/nest-lab`, a NestJS 12 learning application on the Fastify adapter, serving one read endpoint against the existing development database. `apps/server`, `apps/client`, `packages/contracts`, and the deployment pipeline are untouched.

## Approach summary

The lab is a study of the framework, not a migration. It reproduces the smallest surface that exercises the parts of Nest worth learning (modules, providers, constructor injection, pipes, configuration, OpenAPI generation) and stops there. Idiomatic Nest is deliberately preferred over the vertical-slice CQRS architecture in `apps/server`, because reproducing an architecture already understood teaches nothing about the framework.

Contracts are Zod, local to the lab, and the DTO is the `z.infer` type over the schema rather than a decorated class. Zod 4 implements Standard Schema and the Standard JSON Schema extension natively, so validation and OpenAPI generation both work with no adapter, no converter, and no `class-validator`. ADR 0004 records why the shared TypeBox contracts are not consumed.

### Settled decisions

| Axis | Decision |
| --- | --- |
| Identity | `apps/nest-lab`, package `@e-commerce/nest-lab`, port 4001 |
| Scope | `GET /v1/products` only, returning a reduced lab-local shape. `find-product` deferred |
| Contracts | Lab-local Zod schemas; DTO types via `z.infer`; no `@e-commerce/contracts` dependency |
| Architecture | `ProductsModule` with a controller and a service holding inline SQL. No `@nestjs/cqrs`, no repository ports |
| Database | The development Postgres on 127.0.0.1:5433, through `postgres` (postgres.js) in an `@Injectable() DatabaseService` closing the pool in `onModuleDestroy`, with `app.enableShutdownHooks()` |
| Validation | Global `StandardSchemaValidationPipe`; schemas attached as `@Query({ schema })`. No response serializer in this pass |
| Configuration | `@nestjs/config` validating `process.env` with a Zod schema; environment loaded via `node --env-file=.env` |
| Documentation | `@nestjs/swagger` at `/api-docs`, generated from Zod's `~standard.jsonSchema` |
| Logging | The built-in Nest `Logger`. OpenTelemetry is out of scope |
| Build | SWC CLI to `dist`, run as `node --watch dist/main.js`. Type checking stays with tsgo (`tsc --noEmit`) |
| Tests | `node:test` against compiled specs in `dist`, using `@nestjs/testing` and `app.inject()` |
| Pipeline | A `check` script (lint, types, tests), so the root `pnpm check` and CI pick it up. No Docker, no semantic-release, no dependency-cruiser. Not in the root `dev` script |
| Scaffolding | Hand-written. `nest new` emits a Jest, ESLint, Prettier, and webpack setup that contradicts every row above |

### Dependencies

Runtime: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify` 12.0.1, `@nestjs/config` 12.0.0, `@nestjs/swagger` 12.0.1, `@fastify/static` 10.1.3, `rxjs` 7.8.2, `reflect-metadata` 0.2.2, `postgres` 3.4.9, `zod` 4.5.4.

Development: `@nestjs/testing` 12.0.1, `@swc/core` 1.16.1, `@swc/cli` 0.8.1, `typescript` 7.0.2, `@biomejs/biome` 2.5.0, `@types/node` 25.9.3.

Neither `class-validator` nor `class-transformer` appears; both are optional peers of `@nestjs/common` and `@nestjs/swagger`. `nestjs-zod` is excluded: its peer range stops at Nest 11.

## Verified API surface

Read from the published packages and from a spike on `prototype/nest-toolchain-spike`, not from documentation:

- Route schemas attach as `@Query({ schema })`, `@Body({ schema })`, `@Param('id', { schema })`. The option is `ParameterDecoratorOptions.schema`.
- Response schemas attach as `@ApiOkResponse({ standardSchema })`, converted with `schemaType: 'output'`.
- The pipe calls `schema['~standard'].validate(value, options)` and expects `{ value }` or `{ issues: [{ message, path? }] }`. Issue paths are joined with dots into the 400 message.
- `transform` already defaults to `true` in `StandardSchemaValidationPipe`.
- `~standard.jsonSchema` is an object keyed `input` and `output`, each a function called as `convert({ target: 'openapi-3.0' })`. Zod 4.5.4 provides it, so no `standardSchemaConverter` is registered.
- `SwaggerModule.setup(path, app, document, { jsonDocumentUrl: 'api-docs/json' })`. The UI requires `@fastify/static`.
- Shutdown hooks are disabled by default, so `onModuleDestroy` never fires on SIGTERM without `app.enableShutdownHooks()`.

## Traps, each reproduced rather than inferred

1. **Biome cannot parse Nest controllers by default.** Biome 2.5.0 raises a parse error on parameter decorators and stops formatting mid-file. Set `javascript.parser.unsafeParameterDecoratorsEnabled: true`.
2. **Biome's `useImportType` safe fix breaks injection.** `biome check --write` rewrote injected classes to `import type`, and the rebuilt application failed at boot with `UnknownDependenciesException`. Set `style.useImportType: "off"`. Nest 12 names this cause in the error text, so the failure is loud rather than silent.
3. **Node's type stripping rejects decorators** with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`, which is why a build step exists at all.
4. **`erasableSyntaxOnly` forbids parameter properties**, so the lab needs its own `tsconfig.json` rather than a copy of the server's.
5. **Do not copy the server's `#src/*` imports map.** It resolves to `./src`, while the lab runs from `dist`. Use relative `./foo.js` specifiers.
6. **`swc` needs `--strip-leading-paths`**, or the output lands in `dist/src`.
7. **`.swcrc` must set `module.type` explicitly**: `jsc.target` es2023, `parser.decorators` true, `transform.legacyDecorator` and `decoratorMetadata` true, `sourceMaps` true, `module.type` es6.
8. **`z.number().int()` emits `maximum: 9007199254740991`** into the OpenAPI document, since Zod encodes the safe-integer bound. Cosmetic.

## Sub-tasks

### T1: Package scaffolding (no dependencies)

- Goal: the package builds and joins the workspace checks.
- Files: `apps/nest-lab/package.json`, `tsconfig.json`, `.swcrc`, `biome.json`, `.env.example`, `.gitignore`.
- Done-check: `pnpm --filter @e-commerce/nest-lab build` emits `dist`; `pnpm --filter @e-commerce/nest-lab check` passes; `pnpm check` at the root includes it.

### T2: Bootstrap, configuration, and OpenAPI (depends on T1)

- Goal: the application boots, validates its environment, and publishes a document.
- Files: `src/main.ts`, `src/app.module.ts`, `src/config/env.schema.ts`.
- Done-check: the app listens on 4001; a missing or malformed environment variable fails at startup with a Zod message; `GET /api-docs/json` responds.

### T3: Database provider (depends on T2)

- Goal: one connection pool, closed on shutdown.
- Files: `src/database/database.service.ts`.
- Done-check: a query succeeds against the development database; SIGTERM closes the pool rather than leaking it.

### T4: Products slice (depends on T3)

- Goal: the endpoint the whole lab exists to serve.
- Files: `src/products/products.module.ts`, `products.controller.ts`, `products.service.ts`, `products.schema.ts`.
- Done-check: `GET /v1/products?limit=2` returns 200 with two items in the lab shape; `limit=0` and `limit=abc` both return 400; the document shows the query parameter and the response schema.

### T5: Test (depends on T4)

- Goal: one runnable check that fails if the slice breaks.
- Files: `src/products/products.controller.spec.ts`.
- Done-check: `node --enable-source-maps --test "dist/**/*.spec.js"` passes, with the database provider replaced by a stub through `@nestjs/testing`.

## Success criterion

`GET /v1/products?limit=2` returns 200 with a body matching the lab's Zod schema; `/api-docs/json` shows a populated schema for that response; an invalid `limit` returns 400; the test run passes; SIGTERM closes the pool.
