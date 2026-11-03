FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Build context is the monorepo root (see docker-compose).
COPY packages/pih_analytics /packages/pih_analytics
RUN pip install --no-cache-dir /packages/pih_analytics

COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/worker/worker ./worker

CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info"]
