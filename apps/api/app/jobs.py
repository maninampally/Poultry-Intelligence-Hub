"""Fire-and-forget Celery tasks from the API (Phase 2)."""

from __future__ import annotations

import logging

from celery import Celery

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Celery | None = None


def _celery() -> Celery:
    global _client
    if _client is None:
        settings = get_settings()
        _client = Celery("pih-api", broker=settings.redis_url)
        _client.conf.task_serializer = "json"
        _client.conf.accept_content = ["json"]
    return _client


def enqueue_flock_rebuild(flock_id: str) -> None:
    """Best-effort enqueue; never fail the HTTP request if Redis is down."""
    try:
        _celery().send_task("pih.rebuild_flock_metrics", args=[str(flock_id)])
        _celery().send_task("pih.evaluate_alerts", args=[str(flock_id)])
    except Exception:
        logger.exception("failed to enqueue projection tasks for flock %s", flock_id)
