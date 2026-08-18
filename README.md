# Poultry Intelligence Hub

Murgi Mitra — broiler farm management for Indian poultry operations.

pnpm workspace monorepo. TypeScript throughout.

## Layout

```
apps/web                 React + Vite farmer dashboard
apps/api                 Express API
packages/db              PostgreSQL client + .sql query files (packages/db/queries/**)
packages/api-spec        OpenAPI contract and Orval codegen
packages/api-zod         Generated Zod schemas
packages/api-client-react  Generated React Query hooks
scripts                  Seed and one-off jobs
deploy/                  Docker Compose, nginx, systemd examples
docs/                    Architecture notes
```

## Stack

- **Package manager:** pnpm
- **API:** Express 5
- **Database:** PostgreSQL (Supabase-compatible) via `pg`, raw SQL in `packages/db/queries/**`
- **Validation:** Zod
- **Codegen:** Orval (from `packages/api-spec/openapi.yaml`)
- **Web:** React 19, Vite, TanStack Query, wouter, shadcn/ui

## Commands

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm run dev:web          # Vite on http://127.0.0.1:5173
pnpm run dev:api
pnpm run db:migrate       # apply packages/db/migrations/001_init_schema.sql
pnpm run codegen          # regenerate API client + Zod
pnpm run seed             # sample farms, sheds, batches
```

Set `DATABASE_URL` before `db:migrate` or API start — point it at your Supabase Postgres connection string (or any Postgres instance). Copy [`.env.example`](./.env.example) to `.env`.

Every query the API runs lives as a plain `.sql` file under `packages/db/queries/**` (one file per query, `$1`/`$2` params). `packages/db/src/queries/*.ts` just loads and executes them via `pg` — no ORM.

## Self-hosted deploy

See **[deploy/README.md](./deploy/README.md)** for Docker Compose (Postgres + API + nginx).

Product spec: [MVP.md](./MVP.md) · Architecture: [docs/architecture.md](./docs/architecture.md)
