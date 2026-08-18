# Architecture

High-level view of the Poultry Intelligence Hub monorepo.

## Request flow (production)

```
Browser
   │
   ▼
nginx (apps/web Docker image)
   ├── /          → static React SPA (Vite build)
   └── /api/*     → proxy → Express API (apps/api)
                              │
                              ▼
                         PostgreSQL (packages/db)
```

The React app calls `/api/...` on the same origin. Orval-generated hooks in `packages/api-client-react` use that base path.

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Farmer dashboard (React + Vite) |
| `apps/api` | REST API (Express 5) |
| `packages/db` | Postgres client + hand-written `.sql` queries |
| `packages/api-spec` | OpenAPI contract + Orval config |
| `packages/api-zod` | Generated Zod validators (server) |
| `packages/api-client-react` | Generated React Query hooks (web) |
| `scripts` | Seed and maintenance scripts |
| `deploy` | Docker, nginx, systemd examples |

## Codegen workflow

1. Edit `packages/api-spec/openapi.yaml`
2. Run `pnpm run codegen`
3. Server routes validate with `@murgi-mitra/api-zod`; web uses `@murgi-mitra/api-client-react`

## Product roadmap (from MVP)

Not implemented in this repo yet, but planned:

- Mobile app (`apps/mobile`) — React Native / Expo
- Offline sync + local SQLite
- OTP auth (MSG91)
- AI insights (anomaly + LLM advice)
- Integrator multi-farm dashboard

See [MVP.md](../MVP.md) for the full product specification.
