# syntax=docker/dockerfile:1

# Build context is the MONOREPO ROOT (not apps/client): pnpm needs the root
# lockfile to resolve this package's dependencies.
#
# Builds the SSR client and assembles a runtime image that serves dist/ through
# the Express production server (ssr/prod.mjs), proxying /api to $API_URL.
#
# Build locally from the repo root with:
#   docker build -f apps/client/Dockerfile -t e-commerce-client .

ARG NODE_VERSION=24.18

# ---- Base ----
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Build ----
# Fetch deps from the lockfile, install offline, build the SSR client, then
# deploy a self-contained prod node_modules (express + runtime deps).
FROM base AS build

# `pnpm fetch` populates the store from the lockfile alone (manifests ignored),
# so this layer is cached until the lockfile itself changes.
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch

# Bring in the workspace and install from the pre-fetched store (no network).
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --filter @e-commerce/client...

# @e-commerce/contracts resolves to raw TS via its "exports" field for local
# dev; Rsbuild's bundler resolves the same "default" condition at build time,
# so it needs a compiled dist/ to exist before bundling (Rsbuild inlines the
# package into dist/server/index.js, so nothing further is needed at runtime).
RUN pnpm --filter @e-commerce/contracts build

# Produce the SSR build: dist/ (static + manifest.json) and dist/server (SSR bundle).
RUN pnpm --filter @e-commerce/client build
# Portable prod node_modules (real tree, no workspace symlinks).
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm --filter @e-commerce/client --legacy deploy --prod /prod

# ---- Production ----
FROM base AS production

# dumb-init for proper PID 1 signal forwarding.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
# Where /api/* is proxied. Override per environment (e.g. the server's URL).
ENV API_URL=http://localhost:4000

# Non-root user.
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S ssr -u 1001 -G nodejs

# Runtime deps (express, etc.) from the deployed prod tree.
COPY --from=build --chown=ssr:nodejs /prod/node_modules ./node_modules
# Build output + prod server copied explicitly (dist/ is gitignored, so a
# workspace-published deploy is not guaranteed to carry it).
COPY --from=build --chown=ssr:nodejs /app/apps/client/dist ./dist
COPY --from=build --chown=ssr:nodejs /app/apps/client/ssr ./ssr
COPY --from=build --chown=ssr:nodejs /app/apps/client/package.json ./package.json

USER ssr

EXPOSE 3000

CMD ["dumb-init", "node", "ssr/prod.mjs"]
