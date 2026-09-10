"""Adapt sync HTTP DTOs into daily_ops commands."""

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.modules.daily_ops.application.commands import LogMortality, LogMortalityResult
from murgi_mitra.modules.daily_ops.application.service import log_mortality
from murgi_mitra.modules.sync.schemas import MortalitySyncOperation, SyncPushResult


def push_mortality(operation: MortalitySyncOperation, auth: AuthContext) -> SyncPushResult:
    command = LogMortality(
        operation_id=operation.operation_id,
        idempotency_key=operation.idempotency_key,
        entity_id=operation.entity_id,
        batch_id=operation.batch_id,
        shed_id=operation.shed_id,
        count=operation.count,
        shift=operation.shift,
        cause=operation.cause,
        occurred_at=operation.occurred_at,
        tenant_id=auth.tenant_id,
        actor_user_id=auth.user_id,
        supersedes_event_id=operation.supersedes_event_id,
        base_version=operation.base_version,
    )
    result = log_mortality(command, operation_payload=operation.model_dump(mode="json"))
    return _to_sync_result(result)


def _to_sync_result(result: LogMortalityResult) -> SyncPushResult:
    return SyncPushResult(
        operation_id=result.operation_id,
        accepted=result.accepted,
        event_id=result.event_id,
        duplicate=result.duplicate,
        rejection_code=result.rejection_code,
    )
