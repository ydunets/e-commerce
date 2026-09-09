# 4. The Nest lab owns its Zod contracts

Date: 2026-09-01

## Status

Superseded. The goal changed from learning NestJS in a sandbox to rewriting
`apps/server` onto NestJS with the Fastify adapter, which subsumes the lab and
contradicts the central decision below: the rewrite cannot define its own
contracts, because `packages/contracts` stays authoritative for the client.
The replacing decisions are being charted on the wayfinder map, issue #68, and
the records they produce will supersede this one by number.

What survives the supersession is the toolchain reasoning in the Consequences
section, all of which was reproduced rather than inferred and none of which
depends on the lab framing.

## Context

`apps/nest-lab` is a learning application: a NestJS 12 service on the Fastify
adapter, added to study the framework rather than to serve the storefront. Its
existence is the part that needs recording, because the repository already
ships `apps/server`, a Fastify API with the same responsibilities, and anyone
finding two backends will reasonably assume one is replacing the other.

The storefront's request and response shapes live in `packages/contracts` as
TypeBox schemas, shared by `apps/server` and `apps/client`. TypeBox does not
implement Standard Schema, so consuming those schemas from Nest 12 requires a
hand-written `~standard` wrapper. A spike proved that workable, including the
OpenAPI half, and is kept on the `prototype/nest-toolchain-spike` branch. Zod 4
implements both Standard Schema and the Standard JSON Schema extension
natively, so a Zod-based lab needs no wrapper and no schema converter at all.
`nestjs-zod` was considered and rejected: `createZodDto` would have supplied a
real DTO class, but the package's peer range stops at Nest 11.

## Decision

`apps/nest-lab` defines its own Zod schemas and deliberately does not depend on
`@e-commerce/contracts`. Its DTOs are `z.infer` types over those schemas,
attached to routes as `@Query({ schema })` and validated by the built-in
`StandardSchemaValidationPipe`. Class DTOs, `class-validator`, and
`class-transformer` are absent, as is any second validation library:
`@nestjs/config` validates the environment with Zod as well.

The lab sits off the storefront's critical path. `apps/client` never points at
it, the Playwright suite does not know about it, and it is excluded from the
Docker build matrix, from semantic-release, and from the root `dev` script. It
reads the existing development database, whose schema the `dbmate` migrations
in `apps/server/db` continue to own exclusively.

## Consequences

- The product shape exists twice in the repository, in TypeBox for the
  storefront and in Zod for the lab. This is accepted rather than mitigated.
  The lab's shapes are kept deliberately small, so that nobody mistakes them
  for a second implementation of the catalog contract, and drift between the
  two carries no consequence for the storefront.
- Node's native type stripping rejects decorator syntax, so a compile step is
  unavoidable. The lab builds with the SWC CLI to `dist` and runs the compiled
  output, while type checking stays with the workspace's tsgo. A runtime loader
  was rejected because `@swc-node/register` excludes TypeScript 7 in its peer
  range, and the Nest CLI was rejected because it brings a webpack toolchain
  that duplicates biome and tsgo.
- Biome needs two non-default settings in the lab, and both failures are worth
  naming. Without `javascript.parser.unsafeParameterDecoratorsEnabled` it
  raises a parse error on any parameter decorator, which halts formatting
  mid-file. With `style.useImportType` left on, `biome check --write` rewrites
  injected classes to `import type` as a safe fix, the metadata is erased, and
  the application fails to boot with `UnknownDependenciesException`.
- The OpenAPI document at `/api-docs` is generated from Zod's
  `~standard.jsonSchema`, so no `standardSchemaConverter` is registered and
  `zod-openapi` is not a dependency. The recipe in the Nest documentation is
  written for Zod versions that predate the extension.
- Removing the lab is a directory deletion and one workspace entry. Nothing in
  the storefront, the client, or the deployment pipeline depends on it.
