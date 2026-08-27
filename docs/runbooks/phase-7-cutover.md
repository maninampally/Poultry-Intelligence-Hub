# Phase 7 cutover runbook

The FastAPI service is the target API for mobile traffic. Express remains
available only for the legacy web dashboard until parity checks pass.

## Current state

- Mobile sync uses `EXPO_PUBLIC_API_URL` and targets FastAPI.
- FastAPI owns the event-ledger sync endpoints.
- Express remains active for legacy web reads and must not receive new domain
  features.

## Cutover gates

- [ ] Configure `DATABASE_URL` with the Supabase connection string.
- [ ] Apply migrations `001` through `007`.
- [ ] Create tenant and farm memberships for pilot users.
- [ ] Verify mortality, feed, weight, expense, and sale parity.
- [ ] Run duplicate, correction, pull-sync, and cross-tenant authorization tests.
- [ ] Move remaining web reads to FastAPI.
- [ ] Keep Express read-only through one validation window.
- [ ] Remove Express only after the preceding checks pass.

Do not delete `apps/api` or `packages/db` before the parity and rollback checks
are complete.
