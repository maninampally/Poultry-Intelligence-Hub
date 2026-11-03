"""Background tasks: flock metric projections and alert evaluation."""

from __future__ import annotations

import asyncio

from worker.celery_app import celery_app
from worker.projections import compute_and_upsert_flock_metrics, evaluate_flock_alerts


@celery_app.task(bind=True, max_retries=3, name="pih.rebuild_flock_metrics")
def rebuild_flock_metrics(self, flock_id: str) -> dict:
    """Recompute flock_metrics from source records via shared analytics."""
    try:
        return asyncio.run(compute_and_upsert_flock_metrics(flock_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=min(60, 2 ** self.request.retries))


@celery_app.task(bind=True, max_retries=2, name="pih.evaluate_alerts")
def evaluate_alerts(self, flock_id: str) -> dict:
    """Evaluate placeholder mortality rules and write notifications."""
    try:
        return asyncio.run(evaluate_flock_alerts(flock_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=min(60, 2 ** self.request.retries))


@celery_app.task(name="pih.health_check")
def health_check() -> str:
    return "ok"
