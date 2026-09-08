# Celery worker

Python worker entrypoint for projection rebuilds (metrics, feed stock, finance).

```bash
# Redis required
# CELERY_BROKER_URL=redis://127.0.0.1:6379/0

pip install -e ../../packages/backend-core
pip install -e .

celery -A app.celery_app.celery_app worker -l info
```

Requires migrations applied and `DATABASE_URL` set. See root README.
