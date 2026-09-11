"""Application commands for daily operations."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class LogMortality:
    operation_id: UUID
    idempotency_key: str
    entity_id: UUID
    batch_id: UUID
    shed_id: UUID
    count: int
    shift: str
    cause: str | None
    occurred_at: datetime
    tenant_id: str
    actor_user_id: str
    supersedes_event_id: UUID | None = None
    base_version: int | None = None


@dataclass(frozen=True)
class LogMortalityResult:
    operation_id: UUID
    accepted: bool
    event_id: UUID | None = None
    duplicate: bool = False
    rejection_code: str | None = None


@dataclass(frozen=True)
class BatchMetricsView:
    batch_id: UUID
    tenant_id: str
    placement_count: int
    cumulative_mortality: int
    live_bird_count: int
    mortality_percent: float
    last_processed_event_id: UUID | None
    projection_status: str
