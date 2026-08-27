# Mobile app (scaffold)

**Status: scaffold only — not wired to the production API.**

Planned farmer-facing React Native / Expo app for:

- Offline-first daily logging (mortality, feed, weight, cost)
- Local SQLite + sync outbox
- OTP auth, i18n, voice capture

Code under `src/` is exploratory. Auth OTP and `SyncEngine` do **not** call `apps/api` yet.

Do not depend on this package for demos. Use `apps/web` + `apps/api` instead.
