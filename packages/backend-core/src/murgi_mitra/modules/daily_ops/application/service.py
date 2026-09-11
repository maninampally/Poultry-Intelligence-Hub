"""Mortality application service — transaction orchestration only."""

from __future__ import annotations

from uuid import UUID

from murgi_mitra.core.database import apply_rls_context, transaction
from murgi_mitra.modules.daily_ops.application.commands import LogMortality, LogMortalityResult
from murgi_mitra.modules.daily_ops.domain import rules
from murgi_mitra.modules.daily_ops.infrastructure.repository import MortalityRepository


def log_mortality(command: LogMortality, operation_payload: dict | None = None) -> LogMortalityResult:
    rules.validate_mortality_count(command.count)
    rules.validate_shift(command.shift)

    with transaction() as connection:
        apply_rls_context(
            connection,
            user_id=command.actor_user_id,
            tenant_id=command.tenant_id,
        )
        repo = MortalityRepository(connection)
        existing = repo.find_sync_operation(command.idempotency_key, command.tenant_id)
        if existing:
            return LogMortalityResult(
                operation_id=existing["operation_id"],
                accepted=existing["status"] == "accepted",
                event_id=existing["event_id"],
                duplicate=True,
            )

        if command.supersedes_event_id is not None:
            original = repo.load_correction_target(
                command.supersedes_event_id,
                command.tenant_id,
            )
            rules.validate_correction_target(
                original=original,
                batch_id=command.batch_id,
                tenant_id=command.tenant_id,
            )

        event = repo.insert_logged_event(command)
        repo.record_accepted_sync(
            command,
            event,
            operation_payload
            or {
                "operation_id": str(command.operation_id),
                "entity_id": str(command.entity_id),
                "batch_id": str(command.batch_id),
                "shed_id": str(command.shed_id),
                "count": command.count,
                "shift": command.shift,
                "cause": command.cause,
                "supersedes_event_id": (
                    str(command.supersedes_event_id)
                    if command.supersedes_event_id
                    else None
                ),
            },
        )
        return LogMortalityResult(
            operation_id=command.operation_id,
            accepted=True,
            event_id=event.event_id,
        )


def rebuild_batch_metrics(batch_id: UUID) -> None:
    with transaction() as connection:
        repo = MortalityRepository(connection)
        row = repo.load_batch_mortality_totals(batch_id)
        if not row:
            raise ValueError("Batch not found")

        placement = int(row["placement_count"])
        mortality = int(row["mortality"])
        repo.upsert_batch_metrics(
            batch_id=batch_id,
            tenant_id=str(row["tenant_id"]),
            placement_count=placement,
            cumulative_mortality=mortality,
            live_birds=rules.live_bird_count(placement, mortality),
            mortality_pct=rules.mortality_percent(placement, mortality),
            last_event_id=row["last_event_id"],
        )
