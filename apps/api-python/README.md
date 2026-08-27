# FastAPI API

FastAPI service entrypoint for the production API migration.

Run locally:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The current `apps/api` Express service remains read-only legacy infrastructure
for the web dashboard until endpoint parity is verified.
