"""Background tasks. Scaffolds for the analytics/alert pipeline.

These are intentionally thin: projections (flock_metrics, batch_summaries)
are rebuildable from the source ledger, and alert evaluation is deterministic.
Full implementations belong to later phases (BUILD_GUIDE Phase 7).
"""

from __future__ import annotations

from worker.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def rebuild_flock_metrics(self, flock_id: str) -> dict:
    """Recompute flock_metrics from source records. Placeholder scaffold."""
    # TODO(phase-7): open asyncpg connection, read source tables, call the
    # deterministic analytics engine (shared with apps/api), upsert
    # flock_metrics. Projections are always rebuildable from source.
    return {"flock_id": flock_id, "status": "noop-scaffold"}


@celery_app.task(bind=True, max_retries=2)
def evaluate_alerts(self, flock_id: str) -> dict:
    """Evaluate alert rules for a flock and write notifications. Scaffold."""
    # TODO(phase-7): run rule engine (feed deviation, mortality spike,
    # lifting window), insert notifications rows with reason + action.
    return {"flock_id": flock_id, "alerts": 0, "status": "noop-scaffold"}


@celery_app.task
def health_check() -> str:
    return "ok"
