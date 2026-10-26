#!/usr/bin/env bash
# Apply the auth stub + all migrations to a throwaway Postgres container.
# Verifies every migration is syntactically valid and applies in order.
set -euo pipefail

cd "$(dirname "$0")/../.."
CONTAINER=pih-pgtest

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=pih -e POSTGRES_DB=pih \
  -p 55432:5432 postgres:16 >/dev/null

echo "waiting for postgres..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres -d pih >/dev/null 2>&1; then
    echo "ready after ${i}s"; break
  fi
  sleep 1
done

docker exec "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 \
  -c "create extension if not exists pgcrypto;" >/dev/null

echo "=== applying auth stub + migrations ==="
FILES=("supabase/test/0000_auth_stub.sql")
for f in supabase/migrations/*.sql; do FILES+=("$f"); done

for f in "${FILES[@]}"; do
  echo "--- $f"
  docker exec -i "$CONTAINER" psql -U postgres -d pih -v ON_ERROR_STOP=1 -q < "$f"
done

echo "=== table count ==="
docker exec "$CONTAINER" psql -U postgres -d pih -tAc \
  "select count(*) from information_schema.tables where table_schema='public';"

echo "=== RLS-enabled table count ==="
docker exec "$CONTAINER" psql -U postgres -d pih -tAc \
  "select count(*) from pg_tables where schemaname='public' and rowsecurity;"

echo "=== ALL MIGRATIONS APPLIED OK ==="
