# syntax=docker/dockerfile:1

# Build context is the MONOREPO ROOT (not apps/server): pnpm needs the root
# lockfile + workspace manifests to resolve this package's dependencies.
#
# Build locally from the repo root with:
#   docker build -f apps/server/Dockerfile -t e-commerce-server .

ARG NODE_VERSION=24

# ---- Base ----
# Node Alpine for a small image; native TS execution (no compile step).
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Build ----
# Install the workspace (frozen), then `pnpm deploy` the server into a
# self-contained /prod folder: a real node_modules with no workspace symlinks.
FROM base AS build

# Copy only the manifests first so `pnpm install` is cached until deps change.
# All workspace package.json files are required for a --frozen-lockfile install.
# (Add a line here if a new apps/* package is introduced.)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/e2e/package.json apps/e2e/package.json
COPY apps/storybook/package.json apps/storybook/package.json

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @e-commerce/server...

# Now copy the server source and produce the deployable bundle.
COPY apps/server apps/server
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

# Self-contained app (node_modules + src + package.json) from the build stage.
COPY --from=build --chown=fastify:nodejs /prod ./

USER fastify

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"]

CMD ["dumb-init", "node", "--import", "./src/instrumentation.ts", "./src/index.ts"]
