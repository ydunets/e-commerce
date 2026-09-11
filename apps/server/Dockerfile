# syntax=docker/dockerfile:1

# Build context is the MONOREPO ROOT (not apps/server): pnpm needs the root
# lockfile to resolve this package's dependencies.
#
# Build locally from the repo root with:
#   docker build -f apps/server/Dockerfile -t e-commerce-server .

ARG NODE_VERSION=24.18.0

# ---- Base ----
# Node Alpine for the compiled ESM runtime.
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Build ----
# Fetch deps from the lockfile, install offline, then `pnpm deploy` the server
# into a self-contained /prod folder: a real node_modules, no workspace symlinks.
FROM base AS build

# Supply the pinned package manager and build approvals before fetching the
# lockfile dependencies. Source changes do not invalidate this cache layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm fetch

# Bring in the workspace and install from the pre-fetched store (no network).
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --filter @e-commerce/server...

# Compile the shared contracts before the server. Tests are compiled for the
# build-stage checks but the server's files allowlist excludes them from deploy.
RUN pnpm --filter @e-commerce/contracts build
RUN pnpm --filter @e-commerce/server build

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm --filter @e-commerce/server --legacy deploy --prod /prod

# ---- Production ----
FROM base AS production

# dumb-init for proper PID 1 signal forwarding.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
# Bind to all interfaces so the container is reachable from the Docker network.
ENV HOST=0.0.0.0
# OpenTelemetry disabled by default; set to "false" and configure
# OTEL_EXPORTER_OTLP_ENDPOINT to enable telemetry export.
ENV OTEL_SDK_DISABLED=true

# Create a non-root user.
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S fastify -u 1001 -G nodejs

# Self-contained compiled app and production dependencies only.
COPY --from=build --chown=fastify:nodejs /prod ./

USER fastify

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"]

CMD ["dumb-init", "node", "--enable-source-maps", "--import", "reflect-metadata", "--import", "./dist/src/instrumentation.js", "./dist/src/index.js"]
