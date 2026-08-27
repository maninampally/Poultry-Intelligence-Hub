# Poultry Intelligence Hub

**Murgi Mitra** — broiler farm management for Indian poultry operations.

pnpm + TypeScript monorepo. Postgres (Supabase-compatible).

## Active stack (use these)

```
apps/web                   Farmer dashboard (React 19 + Vite)
apps/api                   REST API (Express 5)
packages/db                Postgres client, .sql queries, migrations
packages/api-spec          OpenAPI contract + Orval codegen
packages/api-zod           Generated Zod validators (API)
packages/api-client-react  Generated React Query hooks (web)
scripts                    Seed data
deploy/                    Docker Compose / nginx examples
docs/                      Architecture notes
```

## Scaffolds (not production yet)

```
apps/mobile    Expo/RN farmer app — offline sync stub, not wired to API
apps/worker    Background jobs stub — no queue yet
```

## Commands

```bash
cp .env.example .env
# Set DATABASE_URL to your Supabase Postgres URI

corepack pnpm install
corepack pnpm run db:migrate   # applies packages/db/migrations/001_init_schema.sql
corepack pnpm run seed         # sample farms / batches
corepack pnpm run dev:api      # http://127.0.0.1:8080
corepack pnpm run dev:web      # http://127.0.0.1:5173
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm run codegen      # regenerate client + Zod from OpenAPI
```

## Data flow

```
Browser (apps/web)
   → /api/* (Vite proxy or nginx)
   → Express (apps/api)
   → packages/db (.sql files)
   → PostgreSQL / Supabase
```

Contract-first: edit `packages/api-spec/openapi.yaml`, then `pnpm run codegen`.

## Database

Point `DATABASE_URL` at **Supabase** (Project Settings → Database → URI).  
Migration: [`packages/db/migrations/001_init_schema.sql`](packages/db/migrations/001_init_schema.sql).  
Queries live as plain `.sql` under `packages/db/queries/**` — no ORM.

Optional local Postgres: see [`deploy/README.md`](deploy/README.md).

## Migration status

Mobile sync now targets the FastAPI migration service through
`EXPO_PUBLIC_API_URL`. Express remains the legacy web dashboard API until
Phase 7 parity gates are complete. See
[`docs/runbooks/phase-7-cutover.md`](docs/runbooks/phase-7-cutover.md).

## Not done yet

- Auth / tenant isolation
- Automated tests & CI
- Mobile ↔ API sync
- Worker jobs

Architecture: [`docs/architecture.md`](docs/architecture.md)
