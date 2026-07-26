#!/usr/bin/env bash
# Starts the server, generates REST client types, then stops the server.
# Used by CI (release pipeline) and can be run locally.
# GraphQL type generation was removed with the GraphQL surface (no schema left to
# generate from); reintroduce the graphql-codegen step here if GraphQL comes back.
set -euo pipefail

SERVER_URL="http://127.0.0.1:3000"
MAX_WAIT=30  # seconds

# ── Start the server in the background ──────────────────────────────────────
node --import ./src/instrumentation.ts ./src/index.ts &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# ── Wait for the health endpoint ────────────────────────────────────────────
echo "Waiting for server to be ready…"
elapsed=0
until curl -sf "$SERVER_URL/health" > /dev/null 2>&1; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "Server did not become ready within ${MAX_WAIT}s" >&2
    exit 1
  fi
done
echo "Server is ready (took ${elapsed}s)"

# ── Generate REST types (OpenAPI) ───────────────────────────────────────────
# openapi-typescript drives the classic TypeScript compiler API, which TypeScript
# 7 removed. It lives at the workspace root against the @typescript/typescript6
# compatibility build, so run it from there and pass an absolute output path.
REST_TYPES_OUT="$PWD/client/rest.d.ts"
echo "Generating REST client types…"
pnpm -w exec openapi-typescript "$SERVER_URL/api-docs/json" -o "$REST_TYPES_OUT"

echo "Done — client types written to client/"
