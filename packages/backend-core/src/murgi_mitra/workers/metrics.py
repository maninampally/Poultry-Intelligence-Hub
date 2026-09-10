"""Idempotent mortality projection task — delegates to daily_ops."""

from uuid import UUID

from murgi_mitra.modules.daily_ops.application.service import rebuild_batch_metrics as _rebuild


def rebuild_batch_metrics(batch_id: UUID) -> None:
    _rebuild(batch_id)
