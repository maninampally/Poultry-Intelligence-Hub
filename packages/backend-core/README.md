# Backend core

Shared Python package used by FastAPI (`apps/api-python`) and Celery (`apps/worker-python`).

## Module layout (mortality reference)

```text
src/murgi_mitra/
  core/                 # auth, database, config
  modules/
    sync/               # HTTP sync router + frozen feed/finance handlers
    daily_ops/          # Active modular slice (mortality)
      domain/           # pure rules + event types (no I/O)
      application/      # commands + orchestration
      infrastructure/  # SQL repository + sync DTO adapter
  workers/              # Celery task wrappers → application services
```

Boundary: `router → application service → domain rules → repository → DB + outbox`.

