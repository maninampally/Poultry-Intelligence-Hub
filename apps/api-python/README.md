# FastAPI API

FastAPI service entrypoint for the production API migration.

Run locally:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Express (`apps/api`) remains legacy for the web dashboard until cutover gates
in [`docs/DESIGN.md`](../../docs/DESIGN.md) pass.
