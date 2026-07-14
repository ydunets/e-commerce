#!/bin/sh
set -euo pipefail

# The first attempt may hit a database that is mid-restart (maintenance
# window, stopped server), so retry before treating it as fatal. dbmate
# applies each migration in its own transaction, so a retry after a genuine
# SQL error is a harmless re-run of the same failing statement.
attempt=1
max_attempts=5
until dbmate --no-dump-schema up; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "migrations failed after ${max_attempts} attempts" >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  echo "retrying (attempt ${attempt}/${max_attempts}) in 10s" >&2
  sleep 10
done

# Seeds are tracked in the same schema_migrations table (mirrors the db:seed
# script in apps/server/package.json), so re-runs are no-ops.
dbmate -d ./db/seeds --no-dump-schema up
