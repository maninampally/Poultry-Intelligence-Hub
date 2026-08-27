# Database migration boundary

New event-ledger migrations live under `db/migrations/` as the repository moves
toward Alembic ownership. The legacy TypeScript migration under
`packages/db/migrations/` remains responsible for the current prototype schema.

Migrations `002` through `006` add the event-ledger, sync, projection, feed,
performance, and finance foundations. Migration `007_rbac_rls.sql` enables
Supabase-compatible tenant and farm isolation using `auth.uid()`. Legacy
`public.*_logs` tables remain intact.
