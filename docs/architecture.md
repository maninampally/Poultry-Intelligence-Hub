# Architecture

## Production path (implemented)

```
Browser
   │
   ▼
nginx or Vite (apps/web)
   ├── /          → React SPA
   └── /api/*     → Express API (apps/api)
                        │
                        ▼
                   packages/db  →  PostgreSQL (Supabase or self-hosted)
```

| Path | Role | Status |
|------|------|--------|
| `apps/web` | Farmer dashboard | Active |
| `apps/api` | REST API | Active (no auth yet) |
| `packages/db` | SQL queries + migrations | Active |
| `packages/api-spec` | OpenAPI + Orval | Active |
| `packages/api-zod` | Generated Zod | Active |
| `packages/api-client-react` | Generated React Query hooks | Active |
| `scripts` | Seed job | Active |
| `deploy` | Docker / nginx examples | Active |
| `apps/mobile` | RN/Expo farmer app | Scaffold only |
| `apps/worker` | Alerts / jobs | Scaffold only |

## Codegen

1. Edit `packages/api-spec/openapi.yaml`
2. Run `pnpm run codegen`
3. API validates with `@murgi-mitra/api-zod`; web uses `@murgi-mitra/api-client-react`

## Database

- Schema: `packages/db/migrations/001_init_schema.sql`
- Apply: `pnpm run db:migrate` (needs `DATABASE_URL`)
- One `.sql` file per query under `packages/db/queries/**`

## Roadmap (not implemented)

1. Wire `DATABASE_URL` (Supabase) + migrate + seed — first local run
2. API auth and tenant isolation
3. Tests + CI
4. Mobile OTP + real offline sync against API
5. Worker: alert evaluation, reports
6. Integrator / vet multi-farm views
