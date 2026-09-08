# Mobile app

Expo / React Native farmer client. Offline-first logging with sync toward FastAPI.

## Status

- Local DB, outbox, and `SyncEngine` push/pull against `EXPO_PUBLIC_API_URL` (FastAPI).
- Auth path expects Supabase (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Not yet pilot-ready — use `apps/web` + Express for demos.

## Run (when Expo deps are installed)

```bash
# from repo root .env
# EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...

cd apps/mobile
npx expo start
```

FastAPI must be running on port 8000 for sync.  
See [`README.md`](../../README.md) and [`docs/DESIGN.md`](../../docs/DESIGN.md).
