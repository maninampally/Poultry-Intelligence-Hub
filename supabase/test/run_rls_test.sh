#!/usr/bin/env bash
# Reset the test DB, apply all migrations, then run the RLS test suite.
set -euo pipefail
cd "$(dirname "$0")/../.."
CONTAINER=pih-pgtest

# (Re)create the container if it isn't running.
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" \
    -e POSTGRES_PASSWORD=pih -e POSTGRES_DB=postgres \
    -p 55432:5432 postgres:16 >/dev/null
  for i in $(seq 1 30); do
    docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
    sleep 1
  done
fi

docker exec "$CONTAINER" psql -U postgres -c "drop database if exists pih;" >/dev/null
docker exec "$CONTAINER" psql -U postgres -c "create database pih;" >/dev/null
docker exec "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 \
  -c "create extension if not exists pgcrypto;" >/dev/null

echo "=== applying migrations ==="
docker exec -i "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 -q < supabase/test/0000_auth_stub.sql
for f in supabase/migrations/*.sql; do
  docker exec -i "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 -q < "$f"
done

echo "=== running RLS test suite ==="
docker exec -i "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 < supabase/test/rls_test.sql
