# Supabase — Poultry Intelligence

Migrations and RLS configuration for the cloud backend.

---

## Quick start: demo mode (no Supabase required)

```bash
npm install
npm run dev
# Visit http://localhost:3000/login
# Demo credentials: +91 98765 43210 · OTP: 123456
# All data stays in localStorage
```

---

## Local development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`

### Start local Supabase

```bash
supabase start
# Outputs: API URL, Anon Key, Service Role Key
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values printed by `supabase start`:

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<jwt-secret>
PORT=3000
CORS_ORIGINS=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Apply migrations

```bash
supabase db push
```

### Run the app

```bash
# Terminal 1 – backend
npm run dev:server

# Terminal 2 – frontend
npm run dev
```

---

## Migrations (in order)

| File | Adds |
|------|------|
| `001_init.sql` | profiles, organizations, memberships, devices + RLS |
| `002_*` | (rolled into 001) |
| `003_calculation_helpers.sql` | SQL views for live birds, feed stock, mortality |
| `004_seed_demo_data.sql` | Demo org, users, farms, batches |
| `005_operational_v1.sql` | batches, mortality_events, feed_movements, daily_farm_rounds |
| `006_corrections_audit.sql` | record_corrections, audit_events |
| `016_backend_fixes.sql` | idempotency_key + updated_at columns; RLS fixes; auto-update triggers |

> Run them in order. `supabase db push` handles ordering automatically.

---

## Production deployment

```bash
# Link to hosted project
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

Set environment variables in your hosting platform (Render, Railway, Fly.io, etc.) from `.env.example`.

---

## RLS summary

| Table | Owner | Admin | Worker |
|-------|-------|-------|--------|
| organizations | Read own | Read own | Denied |
| organization_memberships | Full CRUD | Read | Denied |
| devices | Full CRUD | Read | Own device |
| farms / sheds | Full CRUD | Full CRUD | None / assigned |
| batches | Full CRUD | Full CRUD | Read (assigned shed) |
| mortality_events / feed_movements / daily_farm_rounds | Full CRUD | Full CRUD | RW (assigned batch) |
| audit_events | Read | Read | Denied |

---

## Secrets — never commit

- `.env` / `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never in client bundle)
- Any auth tokens

Safe to commit: `.env.example`, migrations, schema definitions.

---

## Troubleshooting

**"Supabase client is not configured"** — env vars missing; app falls back to demo mode (localStorage).

**"RLS policy denied"** — user not in organization, role mismatch, or cross-org access attempt.

**Migrations failed:**
```bash
supabase status
supabase logs
# Last resort (destructive):
supabase db reset
```
