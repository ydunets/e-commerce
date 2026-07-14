# syntax=docker/dockerfile:1

# Migration runner for the Azure Container Apps Job: the dbmate binary plus
# the SQL files, nothing else. No pnpm, no workspace.
#
# Build context is apps/server/db (NOT the monorepo root, unlike the client
# and server images): everything this image needs lives in this directory,
# and the root .dockerignore deliberately excludes it.
#
# Build locally from the repo root with:
#   docker build -f apps/server/db/Dockerfile -t e-commerce-migrations apps/server/db

# Keep in sync with the dbmate devDependency in apps/server/package.json.
ARG DBMATE_VERSION=2.33.0

# dbmate ships a static binary in its official image; copying it from the
# pinned tag beats curl-ing a release (no checksum plumbing needed).
FROM ghcr.io/amacneil/dbmate:${DBMATE_VERSION} AS dbmate

FROM alpine:3.22

# Second guard next to the --no-dump-schema flags in the entrypoint: this
# image must never try to write db/schema.sql.
ENV DBMATE_NO_DUMP_SCHEMA=true

RUN addgroup -g 1001 -S dbmate && \
    adduser  -S dbmate -u 1001 -G dbmate

WORKDIR /app

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate
COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh
# dbmate's default migrations dir is ./db/migrations relative to the cwd.
COPY migrations ./db/migrations
COPY seeds     ./db/seeds

USER dbmate

# dbmate reads the connection string from DATABASE_URL (set by the job as a
# secret ref, sslmode=require included).
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
